import { config } from '../config.js';
import { getSupabaseAdmin } from './supabaseAdmin.js';
import { embedText, buildSystemPrompt, chatCompletion, analyzePerspectives } from './openai.js';
import { searchChunks, searchChunksText, loadChunks } from './vectorStore.js';
import { synthesizeFromChunks } from './synthesize.js';

function buildContext(chunks) {
  if (!chunks.length) return 'Aucun extrait TKV indexé pour le moment.';
  return chunks
    .map(
      (c, i) =>
        `[Source ${i + 1}: ${c.metadata?.title || 'TKV'} — ${c.metadata?.chapter || ''}]\n${c.chunk_text}`
    )
    .join('\n\n---\n\n');
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
    chapter: c.metadata?.chapter || '',
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
  if (embedding) {
    chunks = await searchChunks(admin, embedding, { language, threshold: 0.55 });
    if (chunks.length) mode = 'vector';
  }

  if (!chunks.length) {
    chunks = await searchChunksText(admin, message, { language });
    mode = 'keyword';
  }

  if (!chunks.length) {
    chunks = loadChunks().filter((c) => c.language === language).slice(0, config.ragTopK);
  }

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
