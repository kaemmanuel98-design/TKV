export const BOOK_LANGS = ['fr', 'en', 'es', 'nl', 'pt'];
export const HERITAGE_LANGS = ['fr', 'en'];
export const CHUNK_CHARS = 1800;
export const LEXICON_CHUNK_CHARS = 600;

export function splitText(text, maxLen = CHUNK_CHARS) {
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

export function heritageBlocksToText(blocks) {
  if (!blocks?.length) return '';
  return blocks
    .map((b) => {
      if (b.type === 'p') return b.text;
      if (b.type === 'h2') return `\n## ${b.text}\n`;
      if (b.type === 'quote') return `« ${b.text} » (${b.source || ''})`;
      if (b.type === 'list' && b.items?.length) {
        return b.items.map((item) => `• ${item}`).join('\n');
      }
      return '';
    })
    .filter(Boolean)
    .join('\n\n');
}

export function makeChunk({
  id,
  contentId,
  contentType,
  chunkIndex,
  chunkText,
  language,
  metadata,
  sourcePriority,
}) {
  return {
    id,
    content_id: contentId,
    content_type: contentType,
    chunk_index: chunkIndex,
    chunk_text: chunkText,
    language,
    metadata: {
      ...metadata,
      content_type: contentType,
      source_priority: sourcePriority,
    },
  };
}
