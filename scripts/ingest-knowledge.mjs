/**
 * Pipeline d’ingestion RAG — découpe GYNOSKO en chunks (CdC §4.3)
 * Usage: node scripts/ingest-knowledge.mjs [--embed]
 * Avec OPENAI_API_KEY + --embed : génère les embeddings (text-embedding-3-small)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const CHUNK_CHARS = 1800;
const OUT_PATH = path.join(root, 'server', 'data', 'chunks.json');

const LANGS = ['fr', 'en', 'es', 'nl', 'pt'];

function splitText(text, maxLen) {
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  const chunks = [];
  let buf = '';

  for (const p of paragraphs) {
    if ((buf + p).length > maxLen && buf) {
      chunks.push(buf.trim());
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());

  return chunks.length ? chunks : [text.slice(0, maxLen)];
}

async function loadBook(lang) {
  const mod = await import(`../src/data/gynosko_${lang}.js`);
  return mod.BOOK_DATA;
}

async function buildChunks() {
  const all = [];

  for (const lang of LANGS) {
    try {
      const book = await loadBook(lang);
      const contentId = `gynosko-${lang}`;
      book.chapters.forEach((chapter, chapterIndex) => {
        const parts = splitText(chapter.content, CHUNK_CHARS);
        parts.forEach((chunkText, chunkIndex) => {
          all.push({
            id: `${contentId}-${chapterIndex}-${chunkIndex}`,
            content_id: contentId,
            content_type: 'book',
            chunk_index: chunkIndex,
            chunk_text: chunkText,
            language: lang,
            metadata: {
              title: book.title,
              chapter: chapter.title,
              author: book.author,
            },
          });
        });
      });
      console.log(`  ✓ ${lang}: ${book.chapters.length} chapitres`);
    } catch (e) {
      console.warn(`  ⚠ ${lang}: ignoré (${e.message})`);
    }
  }

  return all;
}

async function embedChunks(chunks) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.warn('OPENAI_API_KEY manquant — chunks sans embeddings.');
    return chunks;
  }

  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: key });
  const batchSize = 20;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const inputs = batch.map((c) => c.chunk_text.slice(0, 8000));
    const res = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: inputs,
    });
    res.data.forEach((row, j) => {
      batch[j].embedding = row.embedding;
    });
    console.log(`  embeddings ${Math.min(i + batchSize, chunks.length)}/${chunks.length}`);
  }

  return chunks;
}

async function main() {
  const withEmbed = process.argv.includes('--embed');
  console.log('Ingestion base de connaissances TKV…');

  let chunks = await buildChunks();
  console.log(`Total chunks: ${chunks.length}`);

  if (withEmbed) {
    chunks = await embedChunks(chunks);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), chunks }, null, 0));
  console.log(`Écrit: ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
