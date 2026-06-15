/** Palette de surlignage des versets (ids stables pour stockage local / Supabase). */
export const HIGHLIGHT_COLORS = [
  {
    id: 'yellow',
    labelKey: 'bible_highlight_color_yellow',
    swatch: '#EAB308',
    bg: 'rgba(234, 179, 8, 0.14)',
    border: 'rgba(234, 179, 8, 0.38)',
  },
  {
    id: 'green',
    labelKey: 'bible_highlight_color_green',
    swatch: '#22C55E',
    bg: 'rgba(34, 197, 94, 0.14)',
    border: 'rgba(34, 197, 94, 0.38)',
  },
  {
    id: 'blue',
    labelKey: 'bible_highlight_color_blue',
    swatch: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.14)',
    border: 'rgba(59, 130, 246, 0.38)',
  },
  {
    id: 'pink',
    labelKey: 'bible_highlight_color_pink',
    swatch: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.14)',
    border: 'rgba(236, 72, 153, 0.38)',
  },
  {
    id: 'purple',
    labelKey: 'bible_highlight_color_purple',
    swatch: '#A855F7',
    bg: 'rgba(168, 85, 247, 0.14)',
    border: 'rgba(168, 85, 247, 0.38)',
  },
  {
    id: 'orange',
    labelKey: 'bible_highlight_color_orange',
    swatch: '#F97316',
    bg: 'rgba(249, 115, 22, 0.14)',
    border: 'rgba(249, 115, 22, 0.38)',
  },
];

export const DEFAULT_HIGHLIGHT_COLOR = 'yellow';

export const HIGHLIGHT_COLOR_IDS = HIGHLIGHT_COLORS.map((c) => c.id);

const colorById = Object.fromEntries(HIGHLIGHT_COLORS.map((c) => [c.id, c]));

export function getHighlightColorMeta(colorId) {
  return colorById[colorId] || colorById[DEFAULT_HIGHLIGHT_COLOR];
}

export function isValidHighlightColor(colorId) {
  return Boolean(colorId && colorById[colorId]);
}

/** Couleur effective d'une note (rétrocompat. booléen `highlighted`). */
export function getVerseHighlightColor(note) {
  if (!note) return null;
  if (isValidHighlightColor(note.highlight_color)) return note.highlight_color;
  if (note.highlighted) return DEFAULT_HIGHLIGHT_COLOR;
  return null;
}

export function getHighlightWrapClass(note) {
  const color = getVerseHighlightColor(note);
  return color ? `bible-verse-wrap--highlight bible-verse-wrap--highlight-${color}` : '';
}

export function getHighlightWrapStyle(note) {
  const color = getVerseHighlightColor(note);
  if (!color) return undefined;
  const meta = getHighlightColorMeta(color);
  return {
    background: meta.bg,
    border: `1px solid ${meta.border}`,
  };
}
