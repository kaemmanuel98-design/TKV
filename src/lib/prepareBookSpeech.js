import { prepareSpeechText } from './speech/prepareText';

function formatScriptureRefs(text, locale) {
  const lang = (locale || 'fr').split('-')[0];
  if (lang === 'fr') {
    return text.replace(
      /([A-Za-zÀ-ÿ][\wÀ-ÿ'’-]*)\s+(\d{1,3})\s*:\s*(\d{1,3}(?:-\d{1,3})?)/g,
      '$1 chapitre $2, verset $3'
    );
  }
  return text.replace(
    /([A-Za-z][\w'-]*)\s+(\d{1,3})\s*:\s*(\d{1,3}(?:-\d{1,3})?)/g,
    '$1 chapter $2, verse $3'
  );
}

/** Prépare le texte d'un chapitre (livre ou module) pour la lecture audio */
export function prepareBookChapterSpeech(content, { locale } = {}) {
  if (!content) return '';

  let t = String(content)
    .replace(/\u00a0/g, ' ')
    .replace(/[«»“”]/g, '"')
    .replace(/\s+—\s+/g, '. ')
    .replace(/\s+–\s+/g, '. ')
    .replace(/\n\s*•\s*/g, '. ')
    .replace(/\n\s*(\d+)\.\s+/g, '. $1. ')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  t = formatScriptureRefs(t, locale);

  return prepareSpeechText(t, { locale, keepReferences: true });
}

export const prepareModuleSpeech = prepareBookChapterSpeech;
