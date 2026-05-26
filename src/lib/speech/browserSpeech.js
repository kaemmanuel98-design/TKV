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

let voicesCache = [];

export function preloadSpeechVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const refresh = () => {
    const list = window.speechSynthesis.getVoices();
    if (list.length) voicesCache = list;
  };

  refresh();
  window.speechSynthesis.onvoiceschanged = refresh;
}

function scoreVoice(voice, locale) {
  const target = locale.toLowerCase();
  const voiceLang = voice.lang.toLowerCase();
  let score = 0;

  if (voiceLang === target) score += 120;
  else if (voiceLang.startsWith(target.split('-')[0])) score += 40;
  else return -1;

  const name = voice.name.toLowerCase();
  for (const hint of QUALITY_HINTS) {
    if (name.includes(hint)) score += 18;
  }
  for (const bad of LOW_QUALITY) {
    if (name.includes(bad)) score -= 40;
  }
  if (!voice.localService) score += 12;
  if (voice.default) score += 4;

  return score;
}

export function pickVoice(locale) {
  const voices = voicesCache.length ? voicesCache : window.speechSynthesis.getVoices();
  const ranked = voices
    .map((v) => ({ voice: v, score: scoreVoice(v, locale) }))
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.voice || voices.find((v) => v.lang.toLowerCase().startsWith(locale.split('-')[0])) || null;
}

export function listVoicesForLocale(locale) {
  const voices = voicesCache.length ? voicesCache : window.speechSynthesis.getVoices();
  const prefix = locale.split('-')[0].toLowerCase();
  return voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
}

function waitForVoices(maxMs = 2500) {
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

export async function speakWithBrowser(text, locale) {
  if (!window.speechSynthesis) {
    throw new Error('unsupported');
  }

  await waitForVoices();
  window.speechSynthesis.cancel();

  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;

    const voice = pickVoice(locale);
    if (voice) utterance.voice = voice;

    utterance.rate = 0.94;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e.error || new Error('speech_error'));

    window.speechSynthesis.speak(utterance);
  });
}

export function stopBrowserSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
