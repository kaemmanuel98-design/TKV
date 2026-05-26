import { DEFAULT_ACCENT, baseLang } from './accents';

/** Locale BCP-47 complète pour la synthèse vocale */
export function resolveSpeechLocale(language, explicitLocale, getAccent) {
  if (explicitLocale) return explicitLocale;
  const code = baseLang(language);
  if (typeof getAccent === 'function') {
    return getAccent(language) || DEFAULT_ACCENT[code] || 'fr-FR';
  }
  return DEFAULT_ACCENT[code] || 'fr-FR';
}

export function isEnglishLocale(locale) {
  return baseLang(locale) === 'en';
}
