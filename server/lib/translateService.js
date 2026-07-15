import { translate } from '@vitalets/google-translate-api';

const MAX_CHUNK = 4500;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const translationCache = new Map();
const CACHE_MAX = 8000;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function cacheKey(text, from, to) {
  return `${from}|${to}|${text}`;
}

function getCached(key) {
  const entry = translationCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    translationCache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key, value) {
  if (translationCache.size >= CACHE_MAX) {
    const oldest = translationCache.keys().next().value;
    if (oldest) translationCache.delete(oldest);
  }
  translationCache.set(key, { value, at: Date.now() });
}

function splitForTranslate(text) {
  const t = String(text || '');
  if (t.length <= MAX_CHUNK) return [t];

  const parts = [];
  const paragraphs = t.split(/\n\n+/);
  let buffer = '';

  const flush = () => {
    if (buffer) parts.push(buffer);
    buffer = '';
  };

  for (const para of paragraphs) {
    if (para.length > MAX_CHUNK) {
      flush();
      const sentences = para.split(/(?<=[.!?…])\s+/u);
      for (const sentence of sentences) {
        if (sentence.length > MAX_CHUNK) {
          flush();
          let pos = 0;
          while (pos < sentence.length) {
            parts.push(sentence.slice(pos, pos + MAX_CHUNK));
            pos += MAX_CHUNK;
          }
        } else {
          const next = buffer ? `${buffer}\n\n${sentence}` : sentence;
          if (next.length > MAX_CHUNK) {
            flush();
            buffer = sentence;
          } else {
            buffer = next;
          }
        }
      }
      continue;
    }

    const next = buffer ? `${buffer}\n\n${para}` : para;
    if (next.length > MAX_CHUNK) {
      flush();
      buffer = para;
    } else {
      buffer = next;
    }
  }

  flush();
  return parts.length ? parts : [t];
}

async function translateChunk(text, { from, to }) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await translate(text, { from, to });
      await delay(2000 + attempt * 600);
      return res.text;
    } catch (e) {
      const rateLimited = /too many requests/i.test(e.message || '');
      if (!rateLimited || attempt === 5) throw e;
      await delay(12000 * (attempt + 1));
    }
  }
  return text;
}

async function translateOne(text, { from, to }) {
  if (!text?.trim()) return text;
  if (from === to) return text;

  const key = cacheKey(text, from, to);
  const cached = getCached(key);
  if (cached != null) return cached;

  const chunks = splitForTranslate(text);
  const out = [];
  for (const chunk of chunks) {
    out.push(await translateChunk(chunk, { from, to }));
  }
  const result = out.join('\n\n');
  setCached(key, result);
  return result;
}

/**
 * @param {string[]} texts
 * @param {{ from?: string, to: string }} opts
 */
export async function translateTexts(texts, { from = 'fr', to }) {
  if (!to) throw new Error('target_required');
  const list = Array.isArray(texts) ? texts : [texts];
  const results = [];

  for (const item of list) {
    results.push(await translateOne(item, { from, to }));
  }

  return results;
}
