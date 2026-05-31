/**
 * Pipeline d’ingestion RAG — cerveau de Mim
 * Sources : livres TKV (GYNOSKO, EIDO), Bible Strong (lexique complet),
 * Héritage (preuves historiques de Jésus), enseignements pastoraux de référence.
 *
 * Usage:
 *   npm run ingest:knowledge
 *   npm run ingest:knowledge:embed   (OPENAI_API_KEY requis)
 *   node scripts/ingest-knowledge.mjs --skip-lexicon   (dev rapide)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  BOOK_LANGS,
  HERITAGE_LANGS,
  CHUNK_CHARS,
  splitText,
  heritageBlocksToText,
  makeChunk,
} from './lib/ingestHelpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
dotenv.config({ path: path.join(root, '.env') });

const OUT_PATH = path.join(root, 'server', 'data', 'chunks.json');
const LEXICON_PATH = path.join(root, 'public', 'bible', 'lexicon.json');

const BOOK_SLUGS = [
  { slug: 'gynosko', loader: (lang) => import(`../src/data/gynosko_${lang}.js`) },
  { slug: 'eido', loader: (lang) => import(`../src/data/eido_${lang}.js`) },
];

const HERITAGE_ARTICLE_IDS = ['jesus', 'resurrection', 'manuscripts', 'gospels', 'archaeology'];

async function buildBookChunks() {
  const all = [];

  for (const { slug, loader } of BOOK_SLUGS) {
    for (const lang of BOOK_LANGS) {
      try {
        const mod = await loader(lang);
        const book = mod.BOOK_DATA;
        const contentId = `${slug}-${lang}`;
        book.chapters.forEach((chapter, chapterIndex) => {
          const parts = splitText(chapter.content, CHUNK_CHARS);
          parts.forEach((chunkText, chunkIndex) => {
            all.push(
              makeChunk({
                id: `${contentId}-${chapterIndex}-${chunkIndex}`,
                contentId,
                contentType: 'tkv_book',
                chunkIndex,
                chunkText,
                language: lang,
                sourcePriority: 100,
                metadata: {
                  title: book.title,
                  chapter: chapter.title,
                  author: book.author,
                  book_slug: slug,
                },
              })
            );
          });
        });
        console.log(`  ✓ livre ${slug} (${lang}): ${book.chapters.length} chapitres`);
      } catch (e) {
        console.warn(`  ⚠ livre ${slug} (${lang}): ignoré (${e.message})`);
      }
    }
  }

  return all;
}

async function buildHeritageChunks() {
  const { HERITAGE_ARTICLES_CONTENT } = await import('../src/data/heritage/heritageArticlesContent.js');
  const all = [];

  for (const articleId of HERITAGE_ARTICLE_IDS) {
    const article = HERITAGE_ARTICLES_CONTENT[articleId];
    if (!article) continue;

    for (const lang of HERITAGE_LANGS) {
      const blocks = article.blocks?.[lang];
      if (!blocks?.length) continue;

      const body = heritageBlocksToText(blocks);
      const parts = splitText(body, CHUNK_CHARS);
      const contentId = `heritage-${articleId}-${lang}`;

      parts.forEach((chunkText, chunkIndex) => {
        all.push(
          makeChunk({
            id: `${contentId}-${chunkIndex}`,
            contentId,
            contentType: 'heritage_history',
            chunkIndex,
            chunkText,
            language: lang,
            sourcePriority: 85,
            metadata: {
              title: 'Héritage chrétien',
              chapter: article.titleKey || articleId,
              article_id: articleId,
              topic: 'historical_jesus',
            },
          })
        );
      });
      console.log(`  ✓ héritage ${articleId} (${lang}): ${parts.length} chunks`);
    }
  }

  return all;
}

async function buildPastorChunks() {
  const { MIM_PASTOR_KNOWLEDGE } = await import('../src/data/mimPastorKnowledge.js');
  return MIM_PASTOR_KNOWLEDGE.map((entry, i) =>
    makeChunk({
      id: `pastor-${entry.id}`,
      contentId: entry.id,
      contentType: 'pastor_teaching',
      chunkIndex: 0,
      chunkText: entry.text,
      language: entry.language,
      sourcePriority: 70,
      metadata: {
        title: entry.title,
        pastor: entry.pastor,
        topics: entry.topics?.join(', '),
      },
    })
  );
}

function lexiconEntryToText(strongId, entry) {
  const lemma =
    entry.lemma?.original ||
    entry.lemma?.fr ||
    entry.lemma?.en ||
    entry.lemma?.he ||
    entry.lemma?.gr ||
    '';
  const fr = entry.gloss?.fr || '';
  const en = entry.gloss?.en || '';
  const lines = [
    `Bible Strong ${strongId}`,
    lemma ? `Mot original : ${lemma}` : '',
    entry.translit ? `Translitération : ${entry.translit}` : '',
    entry.pron ? `Prononciation : ${entry.pron}` : '',
    entry.strongsDef ? `Définition Strong : ${entry.strongsDef}` : '',
    entry.derivation ? `Dérivation : ${entry.derivation}` : '',
    entry.kjvDef ? `Rendu KJV : ${entry.kjvDef}` : '',
    fr ? `Glose FR : ${fr}` : '',
    en ? `Gloss EN : ${en}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}

function buildLexiconChunks() {
  if (!fs.existsSync(LEXICON_PATH)) {
    console.warn('  ⚠ lexicon.json absent — lancez npm run build:bible');
    return [];
  }

  const lexicon = JSON.parse(fs.readFileSync(LEXICON_PATH, 'utf8'));
  const ids = Object.keys(lexicon);
  const all = [];

  for (const strongId of ids) {
    const entry = lexicon[strongId];
    const chunkText = lexiconEntryToText(strongId, entry);
    if (!chunkText || chunkText.length < 20) continue;

    all.push(
      makeChunk({
        id: `strong-${strongId}`,
        contentId: `bible-strong-lexicon`,
        contentType: 'bible_strong',
        chunkIndex: 0,
        chunkText,
        language: 'fr',
        sourcePriority: 90,
        metadata: {
          title: 'Bible Strong',
          strong_id: strongId,
          chapter: entry.lemma?.fr || entry.lemma?.en || strongId,
        },
      })
    );
  }

  console.log(`  ✓ Bible Strong : ${all.length} entrées lexicales`);
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
  const skipLexicon = process.argv.includes('--skip-lexicon');

  console.log('Ingestion cerveau Mim (base TKV)…\n');

  const parts = [
    await buildBookChunks(),
    await buildHeritageChunks(),
    await buildPastorChunks(),
    skipLexicon ? [] : buildLexiconChunks(),
  ];

  let chunks = parts.flat();
  console.log(`\nTotal chunks : ${chunks.length}`);

  if (withEmbed) {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      console.error('OPENAI_API_KEY manquant — ajoutez-la dans .env à la racine du projet.');
      process.exit(1);
    }
    chunks = await embedChunks(chunks);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(
    OUT_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sources: ['tkv_book', 'bible_strong', 'heritage_history', 'pastor_teaching'],
        chunks,
      },
      null,
      0
    )
  );
  console.log(`Écrit : ${OUT_PATH}`);
  if (!withEmbed) {
    console.log('Astuce : npm run ingest:knowledge:embed puis npm run upload:chunks');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
