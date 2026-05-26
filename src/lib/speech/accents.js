/** Accents / locales BCP-47 par langue de l’application */
export const SPEECH_ACCENTS_BY_LANG = {
  fr: [
    { locale: 'fr-FR', labelKey: 'speech_accent_fr_fr' },
    { locale: 'fr-CA', labelKey: 'speech_accent_fr_ca' },
    { locale: 'fr-BE', labelKey: 'speech_accent_fr_be' },
  ],
  en: [
    { locale: 'en-US', labelKey: 'speech_accent_en_us' },
    { locale: 'en-GB', labelKey: 'speech_accent_en_gb' },
    { locale: 'en-AU', labelKey: 'speech_accent_en_au' },
  ],
  es: [
    { locale: 'es-ES', labelKey: 'speech_accent_es_es' },
    { locale: 'es-MX', labelKey: 'speech_accent_es_mx' },
    { locale: 'es-AR', labelKey: 'speech_accent_es_ar' },
  ],
  nl: [
    { locale: 'nl-NL', labelKey: 'speech_accent_nl_nl' },
    { locale: 'nl-BE', labelKey: 'speech_accent_nl_be' },
  ],
  pt: [
    { locale: 'pt-PT', labelKey: 'speech_accent_pt_pt' },
    { locale: 'pt-BR', labelKey: 'speech_accent_pt_br' },
  ],
  ar: [
    { locale: 'ar-SA', labelKey: 'speech_accent_ar_sa' },
    { locale: 'ar-EG', labelKey: 'speech_accent_ar_eg' },
  ],
};

export const DEFAULT_ACCENT = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  nl: 'nl-NL',
  pt: 'pt-PT',
  ar: 'ar-SA',
};

export function baseLang(language) {
  return (language || 'fr').split('-')[0];
}

export function accentsForLanguage(language) {
  const code = baseLang(language);
  return SPEECH_ACCENTS_BY_LANG[code] || SPEECH_ACCENTS_BY_LANG.fr;
}
