const CACHE_VERSION = 'tkv_tr_v2';
const CACHE_MAX = 500;
const BOOK_LANGS = ['fr', 'en', 'es', 'nl', 'pt', 'ar'];

const API_BASE = import.meta.env.VITE_API_URL || '';

function normalizeLang(language) {
  const code = String(language || 'fr').split('-')[0].toLowerCase();
  return BOOK_LANGS.includes(code) ? code : 'fr';
}

function hashKey(text) {
  let h = 5381;
  const s = String(text);
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_VERSION);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(store) {
  try {
    const keys = Object.keys(store);
    if (keys.length > CACHE_MAX) {
      const drop = keys.slice(0, keys.length - CACHE_MAX);
      for (const k of drop) delete store[k];
    }
    localStorage.setItem(CACHE_VERSION, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

function cacheGet(from, to, text) {
  const store = readCache();
  const hit = store[`${from}|${to}|${hashKey(text)}`];
  return hit != null && String(hit).trim() ? hit : null;
}

function cacheSet(from, to, text, translated) {
  if (!translated?.trim()) return;
  const store = readCache();
  store[`${from}|${to}|${hashKey(text)}`] = translated;
  writeCache(store);
}

export function isLikelyFrench(text) {
  if (!text) return false;
  return /[àâäéèêëïîôùûüç]|qu['']|cœur|être|Dieu|Parole|pourquoi|comment/i.test(text.slice(0, 500));
}

export function isUsableInLanguage(text, lang) {
  if (!text?.trim()) return false;
  if (lang === 'fr') return isLikelyFrench(text);
  return !isLikelyFrench(text);
}

async function fetchTranslations(texts, { from, to }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);

  try {
    const res = await fetch(`${API_BASE}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, from, to }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = new Error('translate_failed');
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    return data.translations || [];
  } finally {
    clearTimeout(timer);
  }
}

export async function translateTexts(texts, { from = 'fr', to } = {}) {
  const target = normalizeLang(to);
  const source = normalizeLang(from);

  if (target === source) return [...texts];

  const list = texts.map((t) => String(t ?? ''));
  const results = new Array(list.length);
  const pending = [];

  list.forEach((text, index) => {
    if (!text.trim()) {
      results[index] = text;
      return;
    }
    const cached = cacheGet(source, target, text);
    if (cached != null) {
      results[index] = cached;
      return;
    }
    pending.push({ index, text });
  });

  const BATCH = 4;
  for (let i = 0; i < pending.length; i += BATCH) {
    const slice = pending.slice(i, i + BATCH);
    try {
      const translated = await fetchTranslations(
        slice.map((p) => p.text),
        { from: source, to: target }
      );
      slice.forEach((item, j) => {
        const value = translated[j]?.trim() ? translated[j] : item.text;
        results[item.index] = value;
        if (value !== item.text) cacheSet(source, target, item.text, value);
      });
    } catch {
      slice.forEach((item) => {
        results[item.index] = item.text;
      });
      break;
    }
  }

  return results;
}

/** Traduit un seul chapitre (titre + contenu) — rapide et fiable. */
export async function translateChapter(chapter, { from = 'fr', to, title } = {}) {
  const target = normalizeLang(to);
  const source = normalizeLang(from);

  if (target === source) {
    return { title: title || chapter.title, content: chapter.content };
  }

  const texts = [];
  if (title?.trim()) texts.push(title);
  if (chapter.content?.trim()) texts.push(chapter.content);

  if (!texts.length) {
    return { title: title || chapter.title, content: chapter.content || '' };
  }

  const out = await translateTexts(texts, { from: source, to: target });
  let i = 0;
  const newTitle = title?.trim() ? out[i++] : title || chapter.title;
  const newContent = chapter.content?.trim() ? out[i++] : chapter.content || '';

  return {
    title: newTitle?.trim() ? newTitle : title || chapter.title,
    content: newContent?.trim() ? newContent : chapter.content,
  };
}

export async function translateParagraphs(paragraphs, targetLang, sourceLang = 'fr') {
  const to = normalizeLang(targetLang);
  const from = normalizeLang(sourceLang);
  if (!paragraphs?.length) return [];
  if (to === from) return paragraphs;
  return translateTexts(paragraphs, { from, to });
}
