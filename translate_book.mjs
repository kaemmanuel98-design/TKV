import fs from 'fs';
import { translate } from '@vitalets/google-translate-api';
import { BOOK_DATA as GYNOSKO_FR } from './src/data/gynosko_fr.js';
import { BOOK_DATA as EIDO_FR } from './src/data/eido_fr.js';

const ALL_LANGS = ['en', 'es', 'nl', 'pt', 'ar'];
const SUPPORTED_BOOKS = {
  gynosko: GYNOSKO_FR,
  eido: EIDO_FR,
};

const argv = process.argv.slice(2);
const bookSlug = SUPPORTED_BOOKS[argv[0]] ? argv.shift() : 'gynosko';
const targetLangs = argv.length
  ? argv.filter((l) => ALL_LANGS.includes(l))
  : ALL_LANGS;
const BOOK_DATA = SUPPORTED_BOOKS[bookSlug];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function translateText(text, to, retries = 5) {
  if (!text?.trim()) return text;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await translate(text, { to });
      await delay(1800 + attempt * 800);
      return res.text;
    } catch (e) {
      const isRateLimit = /too many requests/i.test(e.message || '');
      const wait = isRateLimit ? 15000 * (attempt + 1) : 3000 * (attempt + 1);
      console.warn(`  retry ${attempt + 1}/${retries} (${to}): ${e.message?.slice(0, 80)}`);
      await delay(wait);
    }
  }
  console.error(`  failed after retries (${to}), keeping French fragment`);
  return text;
}

async function translateBook() {
  console.log(`Starting translation for ${bookSlug}:`, targetLangs.join(', '));

  for (const lang of targetLangs) {
    console.log(`\nTranslating to ${lang}...`);
    await delay(5000);

    const translatedBook = {
      title: await translateText(BOOK_DATA.title, lang),
      subtitle: await translateText(BOOK_DATA.subtitle, lang),
      author: BOOK_DATA.author,
      chapters: [],
    };

    for (let i = 0; i < BOOK_DATA.chapters.length; i++) {
      const chapter = BOOK_DATA.chapters[i];
      console.log(`  Chapter ${i + 1}/${BOOK_DATA.chapters.length}...`);

      const translatedChapter = {
        title: await translateText(chapter.title, lang),
        content: await translateText(chapter.content, lang),
        quiz: [],
      };

      for (const q of chapter.quiz) {
        const translatedQuiz = {
          question: await translateText(q.question, lang),
          options: [],
          answer: q.answer,
        };
        for (const opt of q.options) {
          translatedQuiz.options.push({
            label: opt.label,
            text: await translateText(opt.text, lang),
          });
        }
        translatedChapter.quiz.push(translatedQuiz);
      }
      translatedBook.chapters.push(translatedChapter);
    }

    const fileContent = `export const BOOK_DATA = ${JSON.stringify(translatedBook, null, 2)};\n`;
    fs.writeFileSync(`./src/data/${bookSlug}_${lang}.js`, fileContent, 'utf-8');
    console.log(`✅ Done ${lang}.`);
    await delay(10000);
  }

  console.log('\n🎉 Finished.');
}

translateBook();
