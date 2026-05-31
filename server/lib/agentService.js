import { config } from '../config.js';
import { getSupabaseAdmin } from './supabaseAdmin.js';
import { embedText, buildSystemPrompt, chatCompletion, analyzePerspectives } from './openai.js';
import { searchChunks, searchChunksText, loadChunks } from './vectorStore.js';
import { synthesizeFromChunks } from './synthesize.js';
import { rankChunks, formatChunkSourceLine } from './knowledgePriority.js';

const RETRIEVE_POOL = Math.max(config.ragTopK * 3, 12);

function buildContext(chunks) {
  if (!chunks.length) return 'Aucun extrait TKV indexé pour le moment.';
  return chunks
    .map((c, i) => `${formatChunkSourceLine(c, i)}\n${c.chunk_text}`)
    .join('\n\n---\n\n');
}

function extractStrongIds(message) {
  const ids = new Set();
  const re = /\b([GH]\d{1,5})\b/gi;
  let m;
  while ((m = re.exec(message)) !== null) {
    ids.add(m[1].toUpperCase());
  }
  return [...ids];
}

function attachStrongChunks(chunks, message) {
  const ids = extractStrongIds(message);
  if (!ids.length) return chunks;

  const pool = loadChunks().filter((c) => c.metadata?.content_type === 'bible_strong');
  const byId = new Map(chunks.map((c) => [c.id, c]));
  for (const sid of ids) {
    const hit = pool.find(
      (c) =>
        c.metadata?.strong_id?.toUpperCase() === sid ||
        c.id === `strong-${sid}` ||
        c.chunk_text?.includes(`Strong ${sid}`)
    );
    if (hit && !byId.has(hit.id)) {
      byId.set(hit.id, { ...hit, similarity: 1, _strongMatch: true });
    }
  }
  return [...byId.values()];
}

function formatSources(chunks) {
  const seen = new Set();
  const unique = [];

  for (const c of chunks) {
    const chapter = c.metadata?.chapter || '';
    const title = c.metadata?.title || 'TKV';
    const key = `${title}::${chapter}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(c);
  }

  return unique.map((c) => ({
    title: c.metadata?.title || 'TKV',
    chapter: c.metadata?.chapter || c.metadata?.strong_id || '',
    sourceType: c.metadata?.content_type || 'tkv',
    pastor: c.metadata?.pastor || '',
    excerpt: c.chunk_text.slice(0, 180) + (c.chunk_text.length > 180 ? '…' : ''),
    similarity: c.similarity,
  }));
}

async function retrieveChunks(admin, message, language) {
  let openaiError = null;
  let mode = 'keyword';

  const embedResult = await embedText(message);
  let embedding = null;
  if (embedResult?.error === 'quota') {
    openaiError = 'quota';
  } else if (Array.isArray(embedResult)) {
    embedding = embedResult;
  }

  let chunks = [];
  const searchOpts = { language, topK: RETRIEVE_POOL, threshold: 0.52 };

  if (embedding) {
    chunks = await searchChunks(admin, embedding, searchOpts);
    if (chunks.length) mode = 'vector';
  }

  if (!chunks.length) {
    chunks = await searchChunksText(admin, message, searchOpts);
    mode = 'keyword';
  }

  if (!chunks.length) {
    chunks = loadChunks()
      .filter((c) => c.language === language || c.metadata?.content_type === 'bible_strong')
      .slice(0, RETRIEVE_POOL);
  }

  chunks = attachStrongChunks(chunks, message);
  chunks = rankChunks(chunks, config.ragTopK);

  return { chunks, mode, openaiError };
}

export async function handleChat({ message, language = 'fr', userType = 'curious', history = [] }) {
  const admin = getSupabaseAdmin();
  const { chunks, mode, openaiError: embedQuota } = await retrieveChunks(admin, message, language);

  const context = buildContext(chunks);
  const system = `${buildSystemPrompt(userType)}\n\n--- CONTEXTE TKV ---\n${context}`;

  let reply = null;
  let openaiError = embedQuota;

  try {
    reply = await chatCompletion({ system, userMessage: message, history });
  } catch (err) {
    if (err?.code === 'insufficient_quota') openaiError = 'quota';
    reply = null;
  }

  if (!reply) {
    reply = synthesizeFromChunks(message, chunks, userType, { language, openaiError });
  }

  return {
    reply,
    sources: formatSources(chunks),
    mode: reply && !openaiError ? `${mode}+openai` : `${mode}+synthesis`,
  };
}

export async function handlePerspectives({ question, language = 'fr', userType = 'curious' }) {
  const admin = getSupabaseAdmin();
  const { chunks, openaiError } = await retrieveChunks(admin, question, language);

  const context = buildContext(chunks);
  let result = null;

  try {
    result = await analyzePerspectives(question, context, userType);
  } catch (err) {
    if (err?.code === 'insufficient_quota') {
      /* fall through */
    }
  }

  if (!result?.believers) {
    result = {
      believers:
        language === 'en'
          ? 'Christian faith sees God as the personal Creator revealed in Scripture, knowable through Christ.'
          : 'La foi chrétienne voit Dieu comme le Créateur personnel révélé dans les Écritures, connaissable en Christ.',
      skeptics:
        language === 'en'
          ? 'A skeptical view asks for testable evidence and questions whether "God" is a necessary explanation.'
          : 'Une lecture sceptique demande des preuves vérifiables et interroge si « Dieu » est une explication nécessaire.',
      synthesis:
        language === 'en'
          ? 'TKV invites dialogue without caricature: intellectual rigor and spiritual openness can coexist.'
          : 'TKV invite un dialogue sans caricature : rigueur intellectuelle et ouverture spirituelle peuvent coexister.',
    };
  }

  return {
    ...result,
    sources: formatSources(chunks),
    mode: openaiError ? 'synthesis' : 'openai',
  };
}
