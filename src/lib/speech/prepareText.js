/** Prépare un texte biblique pour une lecture vocale plus naturelle */
export function prepareSpeechText(text, { locale, keepReferences = false } = {}) {
  if (!text) return '';

  let t = String(text)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\[[^\]]*]/g, '')
    .replace(/\([^)]*cited[^)]*\)/gi, '');
  if (!keepReferences) {
    t = t.replace(/\d+:\d+[^a-zA-Z\u00C0-\u024F\u0600-\u06FF]*/g, '');
  }
  t = t
    .replace(/[“”]/g, '"')
    .trim();

  const lang = (locale || '').split('-')[0];
  if (lang === 'fr') {
    t = t.replace(/\s+([:;!?])/g, '\u00a0$1');
    t = t.replace(/\s+/g, ' ').trim();
  }
  if (lang === 'ar') {
    t = t.replace(/\s+([،؛.!?])/g, '$1');
  }

  return t;
}

export function prepareChapterSpeechText(verses, { locale } = {}) {
  const parts = verses
    .map((v) => prepareSpeechText(typeof v === 'string' ? v : v.text || '', { locale }))
    .filter(Boolean);
  return parts.join('. ');
}
