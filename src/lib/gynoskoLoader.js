import { loadBook } from './bookLoader';

/** @deprecated Utiliser loadBook('gynosko', language) */
export async function loadGynoskoBook(language) {
  return loadBook('gynosko', language);
}
