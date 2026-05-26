/** Langues de lecture Bible Strong (alignées sur i18n de l'app) */
export const BIBLE_READ_LANGS = ['fr', 'en', 'es', 'nl', 'pt', 'ar'];

export function resolveBibleReadLang(i18nLang) {
  const code = (i18nLang || 'fr').split('-')[0];
  return BIBLE_READ_LANGS.includes(code) ? code : 'en';
}

export function pickBibleChapterLang(chapterPayload, readLang) {
  if (!chapterPayload) return null;
  return (
    chapterPayload[readLang] ||
    chapterPayload.en ||
    chapterPayload.fr ||
    Object.values(chapterPayload).find((v) => v?.verses?.length) ||
    null
  );
}
