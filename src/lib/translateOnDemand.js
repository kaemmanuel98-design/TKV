const CACHE_VERSION = 'tkv_tr_v1';
const CACHE_MAX = 400;
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
  return store[`${from}|${to}|${hashKey(text)}`];
}

function cacheSet(from, to, text, translated) {
  const store = readCache();
  store[`${from}|${to}|${hashKey(text)}`] = translated;
  writeCache(store);
}

export function isLikelyFrench(text) {
  if (!text) return false;
  return /[àâäéèêëïîôùûüç]|qu['']|cœur|être|Dieu|Parole|pourquoi|comment/i.test(text.slice(0, 500));
}

export function isUsableInLanguage(text, lang) {
  if (!text?.trim()) return true;
  if (lang === 'fr') return isLikelyFrench(text);
  return !isLikelyFrench(text);
}

async function fetchTranslations(texts, { from, to }) {
  const res = await fetch(`${API_BASE}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, from, to }),
  });

  if (!res.ok) {
    const err = new Error('translate_failed');
    err.status = res.status;
    try {
      const data = await res.json();
      err.code = data.error;
    } catch {
      /* ignore */
    }
    throw err;
  }

  const data = await res.json();
  return data.translations || [];
}

/**
 * Traduit une liste de textes (cache local + API).
 */
export async function translateTexts(texts, { from = 'fr', to, onProgress } = {}) {
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

  onProgress?.(list.length - pending.length, list.length);

  const BATCH = 8;
  for (let i = 0; i < pending.length; i += BATCH) {
    const slice = pending.slice(i, i + BATCH);
    const translated = await fetchTranslations(
      slice.map((p) => p.text),
      { from: source, to: target }
    );
    slice.forEach((item, j) => {
      const value = translated[j] ?? item.text;
      results[item.index] = value;
      cacheSet(source, target, item.text, value);
    });
    onProgress?.(list.length - pending.length + Math.min(i + BATCH, pending.length), list.length);
  }

  return results;
}

export async function translateBookData(bookData, targetLang, { onProgress } = {}) {
  const to = normalizeLang(targetLang);
  const from =
    bookData.contentLang && bookData.chapters?.[0]?.content
      ? normalizeLang(bookData.contentLang)
      : 'fr';

  if (to === from) return bookData;

  const titleFields = [];
  if (bookData.title?.trim()) titleFields.push(bookData.title);
  if (bookData.subtitle?.trim()) titleFields.push(bookData.subtitle);
  const chapterTitles = bookData.chapters.map((c) => c.title);
  const chapterBodies = bookData.chapters.map((c) => c.content);
  const quizTexts = [];

  bookData.chapters.forEach((ch) => {
    ch.quiz?.forEach((q) => {
      quizTexts.push(q.question);
      q.options?.forEach((o) => quizTexts.push(o.text));
    });
  });

  const allTexts = [...titleFields, ...chapterTitles, ...chapterBodies, ...quizTexts];
  const total = allTexts.length;
  let done = 0;

  const translated = await translateTexts(allTexts, {
    from,
    to,
    onProgress: (d) => {
      done = d;
      onProgress?.(done, total);
    },
  });

  let cursor = 0;
  const next = () => translated[cursor++];

  const newTitle = bookData.title?.trim() ? next() : bookData.title;
  const newSubtitle = bookData.subtitle?.trim() ? next() : bookData.subtitle;

  const chapters = bookData.chapters.map((ch) => {
    const title = next();
    const content = next();
    const quiz = (ch.quiz || []).map((q) => ({
      ...q,
      question: next(),
      options: q.options.map((o) => ({ ...o, text: next() })),
    }));
    return { ...ch, title, content, quiz };
  });

  return {
    ...bookData,
    title: newTitle,
    subtitle: newSubtitle,
    chapters,
    contentLang: to,
    uiLang: to,
    usingFallback: false,
    contentMismatch: false,
    translatedOnDemand: true,
  };
}

export async function translateParagraphs(paragraphs, targetLang, sourceLang = 'fr') {
  const to = normalizeLang(targetLang);
  const from = normalizeLang(sourceLang);
  if (!paragraphs?.length) return [];
  if (to === from) return paragraphs;
  return translateTexts(paragraphs, { from, to });
}
