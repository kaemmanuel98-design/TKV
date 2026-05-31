import { chunkTextForSpeech } from './chunkText.js';

const QUALITY_HINTS = [
  'natural',
  'neural',
  'online',
  'google',
  'microsoft',
  'premium',
  'samantha',
  'daniel',
  'denise',
  'henri',
  'hortense',
  'zira',
  'david',
  'amelie',
  'thomas',
];
const LOW_QUALITY = ['espeak', 'compact', 'android'];

const PREFERRED_VOICES = {
  fr: ['hortense', 'denise', 'henri', 'thomas', 'amelie', 'marie', 'claire', 'google français'],
  en: ['samantha', 'daniel', 'karen', 'moira', 'zira', 'david', 'google us english'],
  es: ['helena', 'paulina', 'monica', 'jorge', 'lucia', 'google español'],
  nl: ['colette', 'fenna', 'xander', 'google nederlands'],
  pt: ['raquel', 'joana', 'felipe', 'luciana', 'google português'],
  ar: ['hoda', 'naayf', 'tarik', 'google العربية'],
};

const RATE_BY_LANG = {
  ar: 0.88,
  fr: 0.94,
  en: 0.96,
  es: 0.94,
  nl: 0.94,
  pt: 0.94,
};

let voicesCache = [];
let stopRequested = false;

export function preloadSpeechVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const refresh = () => {
    const list = window.speechSynthesis.getVoices();
    if (list.length) voicesCache = list;
  };

  refresh();
  window.speechSynthesis.onvoiceschanged = refresh;
}

function normalizeVoiceLang(lang) {
  return String(lang || '')
    .toLowerCase()
    .replace(/_/g, '-');
}

function voiceMatchesLocale(voice, locale) {
  const target = normalizeVoiceLang(locale);
  const langPrefix = target.split('-')[0];
  const voiceLang = normalizeVoiceLang(voice.lang);
  if (!voiceLang) return false;
  if (voiceLang === target) return true;
  if (voiceLang === langPrefix) return true;
  if (voiceLang.startsWith(`${langPrefix}-`)) return true;
  return false;
}

/** Évite les voix « English » installées sous une étiquette locale ambiguë */
function voiceNameConflictsLanguage(voice, langPrefix) {
  const voiceLang = normalizeVoiceLang(voice.lang).split('-')[0];
  if (voiceLang === langPrefix) return false;

  const name = voice.name.toLowerCase();
  const conflicts = {
    fr: ['english', ' uk ', ' us english'],
    en: ['français', 'french (france)'],
    es: ['english (us)', 'french (france)'],
    nl: ['english (us)', 'french (france)'],
    pt: ['english (us)', 'french (france)'],
    ar: ['english (us)', 'french (france)'],
  };
  return (conflicts[langPrefix] || []).some((token) => name.includes(token));
}

function scoreVoice(voice, locale) {
  if (!voiceMatchesLocale(voice, locale)) return -1;

  const target = normalizeVoiceLang(locale);
  const voiceLang = normalizeVoiceLang(voice.lang);
  const langPrefix = target.split('-')[0];
  let score = 0;

  if (voiceLang === target) score += 150;
  else if (voiceLang.startsWith(`${langPrefix}-`)) score += 80;
  else if (voiceLang === langPrefix) score += 60;

  if (voiceNameConflictsLanguage(voice, langPrefix)) return -1;

  const name = voice.name.toLowerCase();
  for (const pref of PREFERRED_VOICES[langPrefix] || []) {
    if (name.includes(pref)) score += 40;
  }
  for (const hint of QUALITY_HINTS) {
    if (name.includes(hint)) score += 15;
  }
  for (const bad of LOW_QUALITY) {
    if (name.includes(bad)) score -= 50;
  }
  if (!voice.localService) score += 10;
  if (voice.default && !voiceLang.startsWith(langPrefix)) score -= 100;

  return score;
}

export function pickVoice(locale) {
  const voices = voicesCache.length ? voicesCache : window.speechSynthesis.getVoices();
  const ranked = voices
    .map((v) => ({ voice: v, score: scoreVoice(v, locale) }))
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.voice || null;
}

export function hasVoiceForLocale(locale) {
  return Boolean(pickVoice(locale));
}

export function listVoicesForLocale(locale) {
  const voices = voicesCache.length ? voicesCache : window.speechSynthesis.getVoices();
  return voices.filter((v) => voiceMatchesLocale(v, locale));
}

export function ensureVoicesReady() {
  return waitForVoices();
}

function waitForVoices(maxMs = 6000) {
  return new Promise((resolve) => {
    const grab = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) {
        voicesCache = list;
        resolve(list);
        return true;
      }
      return false;
    };

    if (grab()) return;

    const timeout = setTimeout(() => resolve(voicesCache), maxMs);
    const onChange = () => {
      if (grab()) {
        clearTimeout(timeout);
        window.speechSynthesis.removeEventListener('voiceschanged', onChange);
      }
    };
    window.speechSynthesis.addEventListener('voiceschanged', onChange);
  });
}

function speakOneChunk(text, voice, locale, isRetry = false) {
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang || locale;

    const langCode = locale.split('-')[0];
    utterance.rate = RATE_BY_LANG[langCode] ?? 0.94;
    utterance.pitch = 1;
    utterance.volume = 1;

    let settled = false;
    const finish = (err) => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve();
    };

    utterance.onend = () => finish();
    utterance.onerror = (e) => {
      const code = e?.error || '';
      if (
        !isRetry &&
        (code === 'canceled' || code === 'interrupted')
      ) {
        window.speechSynthesis.cancel();
        setTimeout(() => {
          speakOneChunk(text, voice, locale, true).then(resolve).catch(reject);
        }, 150);
        return;
      }
      finish(new Error(code || 'speech_error'));
    };

    window.speechSynthesis.speak(utterance);

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  });
}

const LOCALE_FALLBACKS_BY_LANG = {
  fr: ['fr-FR', 'fr-CA', 'fr-BE'],
  en: ['en-US', 'en-GB', 'en-AU'],
  es: ['es-ES', 'es-MX', 'es-AR'],
  nl: ['nl-NL', 'nl-BE'],
  pt: ['pt-PT', 'pt-BR'],
  ar: ['ar-SA', 'ar-EG'],
};

function resolveVoice(locale) {
  const voices = voicesCache.length ? voicesCache : window.speechSynthesis.getVoices();
  const langCode = normalizeVoiceLang(locale).split('-')[0];
  const tryLocales = [
    locale,
    ...LOCALE_FALLBACKS_BY_LANG[langCode] || [],
  ];

  const seen = new Set();
  for (const loc of tryLocales) {
    const key = normalizeVoiceLang(loc);
    if (seen.has(key)) continue;
    seen.add(key);
    const v = pickVoice(loc);
    if (v) return v;
  }

  return (
    voices.find((v) => voiceMatchesLocale(v, locale) && !voiceNameConflictsLanguage(v, langCode)) ||
    null
  );
}

export async function speakWithBrowser(text, locale) {
  if (!window.speechSynthesis) {
    throw new Error('unsupported');
  }

  stopRequested = false;
  await waitForVoices();
  window.speechSynthesis.cancel();
  await new Promise((r) => setTimeout(r, 80));

  const voice = resolveVoice(locale);
  if (!voice) {
    throw new Error('no_voice_for_locale');
  }

  const utterLocale = voice.lang || locale;
  const chunks = chunkTextForSpeech(text, 280);
  const segments = chunks.length ? chunks : [text];

  let played = 0;
  for (const chunk of segments) {
    if (stopRequested) break;
    if (!chunk?.trim()) continue;
    await speakOneChunk(chunk, voice, utterLocale);
    played += 1;
    if (stopRequested) break;
    await new Promise((r) => setTimeout(r, 50));
  }

  if (played === 0) {
    throw new Error('speech_not_started');
  }
}

export function stopBrowserSpeech() {
  stopRequested = true;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
