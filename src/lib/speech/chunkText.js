/** Découpe un long texte pour la synthèse vocale du navigateur (limite ~15 s par segment). */
export function chunkTextForSpeech(text, maxLen = 220) {
  const trimmed = text?.trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxLen) return [trimmed];

  const parts = [];
  const sentences = trimmed.split(/(?<=[.!?;:…])\s+/u).filter(Boolean);
  let buffer = '';

  const flush = () => {
    if (buffer.trim()) parts.push(buffer.trim());
    buffer = '';
  };

  for (const sentence of sentences) {
    if (sentence.length > maxLen) {
      flush();
      const words = sentence.split(/\s+/);
      let line = '';
      for (const word of words) {
        const next = line ? `${line} ${word}` : word;
        if (next.length > maxLen) {
          if (line) parts.push(line);
          line = word;
        } else {
          line = next;
        }
      }
      if (line) buffer = line;
      continue;
    }

    const next = buffer ? `${buffer} ${sentence}` : sentence;
    if (next.length > maxLen) {
      flush();
      buffer = sentence;
    } else {
      buffer = next;
    }
  }

  flush();
  return parts.length ? parts : [trimmed];
}
