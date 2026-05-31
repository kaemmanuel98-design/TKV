/** Priorité des sources pour Mim (plus élevé = plus important). */

export const SOURCE_PRIORITY = {
  tkv_book: 100,
  bible_strong: 90,
  heritage_history: 85,
  pastor_teaching: 70,
};

export const SOURCE_LABELS = {
  tkv_book: 'Livre TKV',
  bible_strong: 'Bible Strong',
  heritage_history: 'Héritage · preuves historiques',
  pastor_teaching: 'Enseignement pastoral (référence)',
};

export function priorityForChunk(chunk) {
  const type = chunk.metadata?.content_type;
  return chunk.metadata?.source_priority ?? SOURCE_PRIORITY[type] ?? 50;
}

/** Score de classement = similarité × boost priorité */
export function rankChunks(chunks, topK) {
  const scored = chunks.map((c) => {
    const p = priorityForChunk(c);
    const sim = typeof c.similarity === 'number' ? c.similarity : 0.5;
    const boost = 1 + p / 200;
    return { ...c, _rank: sim * boost, _priority: p };
  });

  scored.sort((a, b) => b._rank - a._rank);

  const seen = new Set();
  const out = [];
  for (const c of scored) {
    const key = c.id || `${c.content_id}-${c.chunk_index}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
    if (out.length >= topK) break;
  }
  return out;
}

export function formatChunkSourceLine(chunk, index) {
  const meta = chunk.metadata || {};
  const typeLabel = SOURCE_LABELS[meta.content_type] || 'TKV';
  const title = meta.title || typeLabel;
  const detail = [meta.chapter, meta.strong_id, meta.pastor].filter(Boolean).join(' · ');
  const priority = priorityForChunk(chunk);
  return `[Source ${index + 1} · priorité ${priority} · ${title}${detail ? ` — ${detail}` : ''}]`;
}
