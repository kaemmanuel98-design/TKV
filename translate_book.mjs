import fs from 'fs';
import { translate } from '@vitalets/google-translate-api';
import { BOOK_DATA } from './src/data/gynosko_fr.js';

const targetLangs = ['en', 'es', 'nl', 'pt', 'ar'];

const delay = ms => new Promise(res => setTimeout(res, ms));

async function translateText(text, to) {
    if (!text) return text;
    try {
        const res = await translate(text, { to });
        await delay(500); // 500ms delay to avoid rate limiting
        return res.text;
    } catch (e) {
        console.error(`Error translating to ${to}:`, e.message);
        return text; // fallback to original
    }
}

async function translateBook() {
    console.log("Starting translation...");
    for (const lang of targetLangs) {
        console.log(`Translating to ${lang}...`);
        
        let translatedBook = {
            title: await translateText(BOOK_DATA.title, lang),
            subtitle: await translateText(BOOK_DATA.subtitle, lang),
            author: BOOK_DATA.author,
            chapters: []
        };

        for (let i = 0; i < BOOK_DATA.chapters.length; i++) {
            const chapter = BOOK_DATA.chapters[i];
            console.log(`  Translating Chapter ${i+1}/${BOOK_DATA.chapters.length}...`);
            
            let translatedChapter = {
                title: await translateText(chapter.title, lang),
                content: await translateText(chapter.content, lang),
                quiz: []
            };

            for (const q of chapter.quiz) {
                let translatedQuiz = {
                    question: await translateText(q.question, lang),
                    options: [],
                    answer: q.answer
                };
                for (const opt of q.options) {
                    translatedQuiz.options.push({
                        label: opt.label,
                        text: await translateText(opt.text, lang)
                    });
                }
                translatedChapter.quiz.push(translatedQuiz);
            }
            translatedBook.chapters.push(translatedChapter);
        }

        const fileContent = `export const BOOK_DATA = ${JSON.stringify(translatedBook, null, 2)};\n`;
        fs.writeFileSync(`./src/data/gynosko_${lang}.js`, fileContent, 'utf-8');
        console.log(`✅ Done translating to ${lang}.`);
    }
    console.log("🎉 All translations completed!");
}

translateBook();
