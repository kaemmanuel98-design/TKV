import { BOOK_META } from '../data/bookMeta';
import {
  isLikelyFrench,
  isUsableInLanguage,
  translateBookData,
} from './translateOnDemand';

const BOOK_LANGS = ['fr', 'en', 'es', 'nl', 'pt', 'ar'];
const SUPPORTED_SLUGS = ['gynosko', 'eido'];

function normalizeLang(language) {
  const code = String(language || 'fr').split('-')[0].toLowerCase();
  return BOOK_LANGS.includes(code) ? code : 'fr';
}

async function importBookFile(slug, fileLang) {
  try {
    const mod = await import(`../data/${slug}_${fileLang}.js`);
    const data = mod.BOOK_DATA;
    if (!data?.chapters?.length) return null;
    return data;
  } catch {
    return null;
  }
}

function enrichBook(slug, data, uiLang, fileLang, extra = {}) {
  const meta = BOOK_META[slug]?.langs[uiLang] || BOOK_META[slug]?.langs.fr;
  const metaRoot = BOOK_META[slug];

  return {
    ...data,
    slug,
    coverUrl: metaRoot?.coverUrl,
    theme: metaRoot?.theme,
    title: data.title || slug.toUpperCase(),
    subtitle: meta?.subtitle ?? data.subtitle,
    tagline: meta?.tagline,
    author: data.author || 'Ange Emmanuel Kouamé',
    contentLang: fileLang,
    uiLang,
    usingFallback: fileLang !== uiLang,
    contentMismatch:
      uiLang !== fileLang &&
      uiLang !== 'fr' &&
      fileLang !== 'en' &&
      isLikelyFrench(data.chapters[0]?.content || ''),
    ...extra,
  };
}

/**
 * Charge un livre ; traduit à la demande via /api/translate si la langue n'est pas disponible.
 */
export async function loadBook(slug, language, { onTranslateProgress } = {}) {
  if (!SUPPORTED_SLUGS.includes(slug)) return null;

  const uiLang = normalizeLang(language);
  const tryOrder = [...new Set([uiLang, 'en', 'fr'])];

  for (const fileLang of tryOrder) {
    const data = await importBookFile(slug, fileLang);
    if (!data) continue;

    const sample = data.chapters[0]?.content || '';
    if (fileLang === uiLang && isUsableInLanguage(sample, uiLang)) {
      return enrichBook(slug, data, uiLang, fileLang);
    }
  }

  const sourceLang = (await importBookFile(slug, 'fr')) ? 'fr' : 'en';
  const sourceData = (await importBookFile(slug, sourceLang)) || (await importBookFile(slug, 'fr'));
  if (!sourceData) return null;

  if (uiLang === sourceLang) {
    return enrichBook(slug, sourceData, uiLang, sourceLang);
  }

  const base = enrichBook(slug, sourceData, uiLang, sourceLang, {
    usingFallback: true,
    contentMismatch: true,
  });

  try {
    const translated = await translateBookData(base, uiLang, {
      onProgress: onTranslateProgress,
    });
    return translated;
  } catch (e) {
    console.warn('[bookLoader] translate on demand failed', e);
    return base;
  }
}

export { SUPPORTED_SLUGS };
