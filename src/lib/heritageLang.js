const SUPPORTED = ['fr', 'en', 'es', 'nl', 'pt', 'ar'];

export function resolveHeritageLang(i18n) {
  const code = i18n.language?.split('-')[0] || 'fr';
  return SUPPORTED.includes(code) ? code : 'en';
}

export function pickLocalized(map, lang) {
  if (!map) return [];
  return map[lang] || map.en || map.fr || [];
}
