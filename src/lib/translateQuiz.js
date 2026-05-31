import { translateTexts } from './translateOnDemand';

/**
 * Traduit les questions de quiz cours (source fr/en) en conservant les labels a)–d) et la clé de réponse.
 * @param {Array<{ question: string, options: Array<{ label: string, text: string }>, answer: string }>} questions
 */
export async function translateQuizQuestions(questions, targetLang, sourceLang = 'fr') {
  if (!questions?.length) return [];
  if (targetLang === sourceLang) return questions;

  const flat = [];
  const map = [];

  questions.forEach((q, qi) => {
    map.push({ qi, field: 'question', flatIdx: flat.length });
    flat.push(q.question);
    q.options.forEach((opt, oi) => {
      map.push({ qi, field: 'option', oi, flatIdx: flat.length });
      flat.push(opt.text);
    });
  });

  const translated = await translateTexts(flat, { from: sourceLang, to: targetLang });

  const result = questions.map((q) => ({
    question: q.question,
    answer: q.answer,
    options: q.options.map((opt) => ({ label: opt.label, text: opt.text })),
  }));

  map.forEach(({ qi, field, oi, flatIdx }) => {
    const text = translated[flatIdx] ?? flat[flatIdx];
    if (field === 'question') result[qi].question = text;
    else result[qi].options[oi].text = text;
  });

  return result;
}
