import { translate } from '@vitalets/google-translate-api';

const MAX_CHUNK = 4500;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

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
      await delay(900 + attempt * 400);
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

  const chunks = splitForTranslate(text);
  const out = [];
  for (const chunk of chunks) {
    out.push(await translateChunk(chunk, { from, to }));
  }
  return out.join('\n\n');
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
