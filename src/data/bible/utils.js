/** Construit des segments cliquables à partir du texte et des mots annotés Strong */
export function buildSegments(text, highlights = []) {
  if (!highlights.length) return [{ t: text, s: null }];

  const sorted = [...highlights]
    .map((h) => ({ ...h, index: text.indexOf(h.w) }))
    .filter((h) => h.index >= 0)
    .sort((a, b) => a.index - b.index);

  const segments = [];
  let pos = 0;

  for (const { w, s, index } of sorted) {
    if (index < pos) continue;
    if (index > pos) segments.push({ t: text.slice(pos, index), s: null });
    segments.push({ t: w, s });
    pos = index + w.length;
  }

  if (pos < text.length) segments.push({ t: text.slice(pos), s: null });
  return segments.length ? segments : [{ t: text, s: null }];
}

export function verse(id, text, highlightPairs = []) {
  const highlights = highlightPairs.map(([w, s]) => ({ w, s }));
  return { id, segments: buildSegments(text, highlights), text };
}

export function verseText(v) {
  return v.text || v.segments.map((s) => s.t).join('');
}
