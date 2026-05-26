/** Voix et consignes TTS par locale (lecture biblique naturelle) */

export const TTS_VOICE_BY_LOCALE = {
  'fr-FR': 'shimmer',
  'fr-CA': 'shimmer',
  'fr-BE': 'nova',
  'en-US': 'alloy',
  'en-GB': 'fable',
  'en-AU': 'echo',
  'es-ES': 'nova',
  'es-MX': 'shimmer',
  'es-AR': 'onyx',
  'nl-NL': 'fable',
  'nl-BE': 'alloy',
  'pt-PT': 'nova',
  'pt-BR': 'shimmer',
  'ar-SA': 'onyx',
  'ar-EG': 'echo',
};

const LANGUAGE_LABEL = {
  fr: 'French',
  en: 'English',
  es: 'Spanish',
  nl: 'Dutch',
  pt: 'Portuguese',
  ar: 'Arabic',
};

export const TTS_INSTRUCTIONS_BY_LOCALE = {
  'fr-FR':
    'Speak exclusively in metropolitan French (France). You are a native Parisian narrator reading the Bible. Use natural French intonation, liaisons, and nasal vowels. Never pronounce French words with English phonetics.',
  'fr-CA':
    'Speak exclusively in Canadian French (Quebec). Native pronunciation, natural rhythm for Scripture reading. Never use English phonetics.',
  'fr-BE':
    'Speak exclusively in French (Belgium). Clear native European French for Bible reading.',
  'en-US':
    'Speak in American English with native pronunciation, steady pace, suitable for Bible reading.',
  'en-GB':
    'Speak in British English with native UK pronunciation and measured rhythm for Scripture.',
  'en-AU':
    'Speak in Australian English with native pronunciation for Scripture reading.',
  'es-ES':
    'Speak exclusively in Spanish from Spain (Castilian). Native pronunciation for Bible reading. Never use English phonetics.',
  'es-MX':
    'Speak exclusively in Mexican Spanish. Native pronunciation for Scripture.',
  'es-AR':
    'Speak exclusively in Argentine Spanish. Native pronunciation for Scripture.',
  'nl-NL':
    'Speak exclusively in Dutch (Netherlands). Native pronunciation for Bible reading.',
  'nl-BE':
    'Speak exclusively in Dutch (Belgium). Native pronunciation for Scripture.',
  'pt-PT':
    'Speak exclusively in European Portuguese. Native pronunciation for Bible reading.',
  'pt-BR':
    'Speak exclusively in Brazilian Portuguese. Native pronunciation for Scripture.',
  'ar-SA':
    'Speak exclusively in Modern Standard Arabic with native Saudi pronunciation. Steady, clear pace for Scripture.',
  'ar-EG':
    'Speak exclusively in Modern Standard Arabic with Egyptian pronunciation for Scripture.',
};

export const TTS_SPEED_BY_LANG = {
  ar: 0.92,
  fr: 0.96,
  en: 1,
  es: 0.96,
  nl: 0.96,
  pt: 0.96,
};

export function pickTtsVoice(locale) {
  if (locale && TTS_VOICE_BY_LOCALE[locale]) return TTS_VOICE_BY_LOCALE[locale];
  const base = locale?.split('-')[0];
  const fallback = Object.entries(TTS_VOICE_BY_LOCALE).find(([k]) => k.startsWith(`${base}-`));
  return fallback?.[1] || 'shimmer';
}

export function pickTtsInstructions(locale) {
  if (locale && TTS_INSTRUCTIONS_BY_LOCALE[locale]) return TTS_INSTRUCTIONS_BY_LOCALE[locale];
  const base = locale?.split('-')[0];
  const label = LANGUAGE_LABEL[base] || base;
  const fallback = Object.entries(TTS_INSTRUCTIONS_BY_LOCALE).find(([k]) =>
    k.startsWith(`${base}-`)
  );
  return (
    fallback?.[1] ||
    `Speak exclusively in ${label} with native pronunciation. Never use English phonetics for ${label} words.`
  );
}

export function pickTtsSpeed(locale) {
  const base = locale?.split('-')[0];
  return TTS_SPEED_BY_LANG[base] ?? 1;
}

export function pickTtsLanguage(locale) {
  return locale?.split('-')[0] || 'fr';
}
