import { resolveFrenchBibleTextKey } from './frenchVersions.js';

/** Langues de lecture Bible Strong (alignées sur i18n de l'app) */
export const BIBLE_READ_LANGS = ['fr', 'en', 'es', 'nl', 'pt', 'ar'];

export function resolveBibleReadLang(i18nLang) {
  const code = (i18nLang || 'fr').split('-')[0];
  return BIBLE_READ_LANGS.includes(code) ? code : 'en';
}

/** Clé de texte dans les chapitres JSON (fr vs fr_pdv). */
export function resolveBibleTextKey(readLang, frenchVersion) {
  if (readLang === 'fr') return resolveFrenchBibleTextKey(frenchVersion);
  return readLang;
}

export function pickBibleChapterLang(chapterPayload, readLang, frenchVersion = 'fr') {
  if (!chapterPayload) return null;
  const textKey = resolveBibleTextKey(readLang, frenchVersion);
  return (
    chapterPayload[textKey] ||
    chapterPayload[readLang] ||
    chapterPayload.fr ||
    chapterPayload.en ||
    Object.values(chapterPayload).find((v) => v?.verses?.length) ||
    null
  );
}
