import { BOOK_META } from '../data/bookMeta';
import { isLikelyFrench, isUsableInLanguage } from './translateOnDemand';

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

  const sample = data.chapters[0]?.content || '';
  const usableInUi =
    fileLang === uiLang && (uiLang === 'fr' || uiLang === 'en' || isUsableInLanguage(sample, uiLang));

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
    usingFallback: !usableInUi,
    contentMismatch:
      !usableInUi &&
      uiLang !== 'fr' &&
      isLikelyFrench(sample),
    needsChapterTranslation: !usableInUi && uiLang !== fileLang,
    ...extra,
  };
}

/**
 * Charge un livre immédiatement (sans traduire tout le livre — traduction par chapitre dans le lecteur).
 */
export async function loadBook(slug, language) {
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

  const frData = await importBookFile(slug, 'fr');
  const sourceData = frData || (await importBookFile(slug, 'en'));
  if (!sourceData) return null;

  const sourceLang = frData ? 'fr' : 'en';
  return enrichBook(slug, sourceData, uiLang, sourceLang);
}

export { SUPPORTED_SLUGS, normalizeLang as normalizeBookLang };
