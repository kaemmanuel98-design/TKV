import { baseLang } from './accents';
import { resolveSpeechLocale } from './locale';

/**
 * Langue du texte réellement lu à voix haute (pas la langue UI si le chapitre est encore en source).
 */
export function resolveBookSpeechLanguage(book, { translating = false } = {}) {
  if (!book) return 'fr';

  if (book.needsChapterTranslation) {
    if (translating) return book.contentLang || book.uiLang || 'fr';
    return book.uiLang || 'fr';
  }

  return book.contentLang || book.uiLang || 'fr';
}

/** Locale BCP-47 pour TTS à partir de la langue du contenu */
export function resolveContentSpeechLocale(contentLanguage, getAccent) {
  const lang = baseLang(contentLanguage);
  return resolveSpeechLocale(lang, null, getAccent);
}
