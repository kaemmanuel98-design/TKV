import { HIGHLIGHT_COLOR_IDS } from '../../data/bible/highlightColors';

const STORAGE_KEY = 'tkv_bible_highlight_labels';

function storageKey(userId) {
  return `${userId || 'guest'}`;
}

export function loadHighlightLabels(userId) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const mine = all[storageKey(userId)] || {};
    const clean = {};
    for (const id of HIGHLIGHT_COLOR_IDS) {
      const label = String(mine[id] || '').trim();
      if (label) clean[id] = label.slice(0, 48);
    }
    return clean;
  } catch {
    return {};
  }
}

export function saveHighlightLabels(userId, labels) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const clean = {};
    for (const id of HIGHLIGHT_COLOR_IDS) {
      const label = String(labels?.[id] || '').trim();
      if (label) clean[id] = label.slice(0, 48);
    }
    all[storageKey(userId)] = clean;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return clean;
  } catch {
    return labels || {};
  }
}

export function getHighlightColorLabel(colorId, t, customLabels = {}) {
  const custom = String(customLabels?.[colorId] || '').trim();
  if (custom) return custom;
  const key = `bible_highlight_color_${colorId}`;
  return t(key, { defaultValue: colorId });
}
