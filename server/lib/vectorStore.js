import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import { SOURCE_PRIORITY } from './knowledgePriority.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHUNKS_PATH = path.join(__dirname, '../data/chunks.json');

let chunksCache = null;

function cosineSimilarity(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export function loadChunks() {
  if (chunksCache) return chunksCache;
  if (!fs.existsSync(CHUNKS_PATH)) {
    chunksCache = [];
    return chunksCache;
  }
  const raw = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf8'));
  chunksCache = raw.chunks || [];
  return chunksCache;
}

export async function searchChunksLocal(embedding, { language = 'fr', topK = config.ragTopK, threshold = config.ragThreshold }) {
  const chunks = loadChunks().filter(
    (c) => c.embedding && (!language || c.language === language)
  );

  const scored = chunks
    .map((c) => ({
      ...c,
      similarity: cosineSimilarity(embedding, c.embedding),
    }))
    .filter((c) => c.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return scored;
}

export async function searchChunksSupabase(supabaseAdmin, embedding, { language = 'fr', topK = config.ragTopK, threshold = config.ragThreshold }) {
  const { data, error } = await supabaseAdmin.rpc('match_knowledge_chunks', {
    query_embedding: embedding,
    match_count: topK,
    match_threshold: threshold,
    filter_language: language,
  });

  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    chunk_text: row.chunk_text,
    metadata: row.metadata,
    similarity: row.similarity,
  }));
}

export async function searchChunks(supabaseAdmin, embedding, options) {
  if (!embedding || embedding?.error) return [];
  if (supabaseAdmin && Array.isArray(embedding)) {
    try {
      const results = await searchChunksSupabase(supabaseAdmin, embedding, options);
      if (results.length > 0) return results;
    } catch {
      /* fallback local */
    }
  }
  if (Array.isArray(embedding)) {
    return searchChunksLocal(embedding, options);
  }
  return [];
}

/** Recherche par mots-clés (chunks sans embedding en base) */
export async function searchChunksText(supabaseAdmin, query, { language = 'fr', topK = config.ragTopK } = {}) {
  const rawTerms = normalize(query)
    .split(/\W+/)
    .filter((w) => w.length > 2);
  const terms = [...new Set(rawTerms)];
  if (terms.length === 0) terms.push('dieu', 'foi');

  const boostTerms = ['dieu', 'god', 'christ', 'jesus', 'jesus', 'connaître', 'connaitre', 'parole', 'vie'];

  let pool = [];
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('knowledge_chunks')
      .select('id, chunk_text, metadata, language')
      .eq('language', language);
    if (!error && data?.length) pool = data;
  }
  if (!pool.length) {
    pool = loadChunks().filter((c) => c.language === language);
  }

  const scored = pool
    .map((c) => {
      const text = normalize(c.chunk_text);
      let score = 0;
      for (const t of terms) {
        if (text.includes(t)) score += 2;
      }
      for (const b of boostTerms) {
        if (terms.some((t) => b.includes(t) || t.includes(b)) && text.includes(b)) score += 1;
      }
      if (isAboutGodQuery(query) && text.includes('dieu')) score += 3;

      const type = c.metadata?.content_type;
      const priority = c.metadata?.source_priority ?? SOURCE_PRIORITY[type] ?? 50;
      score *= 1 + priority / 150;

      if (type === 'bible_strong' && /\b(strong|grec|hebreu|hébreu|mot original|lemma)\b/i.test(query)) {
        score += 4;
      }
      if (type === 'heritage_history' && /\b(histor|preuve|exist|tacite|josephe|manuscrit|archéo)\b/i.test(query)) {
        score += 3;
      }
      if (type === 'tkv_book') score += 2;

      return { ...c, similarity: score };
    })
    .filter((c) => c.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity);

  const top = scored.slice(0, topK);
  if (top.length) return top;

  return pool.slice(0, topK).map((c) => ({ ...c, similarity: 0.1 }));
}

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function isAboutGodQuery(query) {
  return /\bdieu\b|\bgod\b/.test(normalize(query));
}
