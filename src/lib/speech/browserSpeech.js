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

function voiceMatchesLocale(voice, locale) {
  const target = locale.toLowerCase();
  const langPrefix = target.split('-')[0];
  const voiceLang = voice.lang.toLowerCase();
  if (voiceLang === target) return true;
  if (voiceLang.startsWith(`${langPrefix}-`)) return true;
  return false;
}

function scoreVoice(voice, locale) {
  if (!voiceMatchesLocale(voice, locale)) return -1;

  const target = locale.toLowerCase();
  const voiceLang = voice.lang.toLowerCase();
  const langPrefix = target.split('-')[0];
  let score = 0;

  if (voiceLang === target) score += 150;
  else if (voiceLang.startsWith(`${langPrefix}-`)) score += 80;

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

function speakOneChunk(text, voice, locale) {
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;

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
    utterance.onerror = (e) => finish(e.error || new Error('speech_error'));

    window.speechSynthesis.speak(utterance);

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  });
}

function resolveVoice(locale) {
  const voices = voicesCache.length ? voicesCache : window.speechSynthesis.getVoices();
  const langCode = locale.split('-')[0];
  const fallbacks = [locale, `${langCode}-${langCode.toUpperCase()}`, 'fr-FR', 'en-US', 'en-GB'];

  for (const loc of fallbacks) {
    const v = pickVoice(loc);
    if (v) return v;
  }

  return (
    voices.find((v) => v.lang?.toLowerCase().startsWith(langCode)) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('en')) ||
    voices.find((v) => v.default) ||
    voices[0] ||
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

  const voice = resolveVoice(locale);
  if (!voice) {
    throw new Error('no_voice_for_locale');
  }

  const utterLocale = voice.lang || locale;
  const chunks = chunkTextForSpeech(text, 280);

  for (const chunk of chunks) {
    if (stopRequested) break;
    await speakOneChunk(chunk, voice, utterLocale);
    if (stopRequested) break;
    await new Promise((r) => setTimeout(r, 60));
  }
}

export function stopBrowserSpeech() {
  stopRequested = true;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
