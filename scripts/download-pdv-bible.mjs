/**
 * Télécharge la Bible Parole de Vie 2017 (YouVersion id 133) au format thiagobodruk.
 * Usage : node scripts/download-pdv-bible.mjs
 * Cache : scripts/.cache/bible/fr_pdv.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BIBLE_BOOKS } from '../src/data/bible/books.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '.cache', 'bible');
const OUT = path.join(CACHE_DIR, 'fr_pdv.json');
const YV_VERSION_ID = 133;
const YV_BASE = 'https://bible.youversionapi.com/3.1/chapter.json';
const DELAY_MS = 120;

function decodeHtmlEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&nbsp;/g, ' ');
}

function stripHtmlTags(html) {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function parseYouVersionChapterHtml(html) {
  const byVerse = new Map();
  const verseRe =
    /<span class="verse v\d+"[^>]*data-usfm="[^"]+\.(\d+)"[^>]*>([\s\S]*?)<\/span>\s*(?=<span class="verse|<\/p>|$)/g;
  let m;
  while ((m = verseRe.exec(html)) !== null) {
    const vNum = parseInt(m[1], 10);
    const inner = m[2].replace(/<span class="label">\d+<\/span>\s*/, '');
    const text = stripHtmlTags(inner);
    if (text) byVerse.set(vNum, text);
  }
  return byVerse;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadYouVersionChapterCounts() {
  const res = await fetch(`https://www.bible.com/api/bible/version/${YV_VERSION_ID}`);
  if (!res.ok) return {};
  const json = await res.json();
  const counts = {};
  for (const book of json.books || []) {
    if (!book?.usfm || book.usfm.includes('.')) continue;
    counts[book.usfm] = (book.chapters || []).filter((ch) => ch.canonical).length;
  }
  return counts;
}

async function fetchChapter(usfm, chapter) {
  const url = `${YV_BASE}?id=${YV_VERSION_ID}&reference=${usfm}.${chapter}`;
  const res = await fetch(url);
  if (res.status === 404) return new Map();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${usfm}.${chapter}`);
  const json = await res.json();
  if (json?.response?.code !== 200) {
    throw new Error(`YouVersion error ${usfm}.${chapter}: ${JSON.stringify(json?.response?.data?.errors || json)}`);
  }
  return parseYouVersionChapterHtml(json.response.data.content || '');
}

async function main() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const yvChapterCounts = await loadYouVersionChapterCounts();

  const books = [];
  let chapterCount = 0;

  for (const book of BIBLE_BOOKS) {
    const chapters = [];
    const maxChapter = Math.min(
      book.chapters,
      yvChapterCounts[book.usfm] || book.chapters
    );
    console.log(`  ${book.usfm} (${maxChapter} ch.)…`);

    for (let ch = 1; ch <= book.chapters; ch += 1) {
      let versesMap = new Map();
      if (ch <= maxChapter) {
        versesMap = await fetchChapter(book.usfm, ch);
        await sleep(DELAY_MS);
      }
      const chapterVerses = [];
      const maxVerse = versesMap.size ? Math.max(...versesMap.keys()) : 0;
      for (let v = 1; v <= maxVerse; v += 1) {
        chapterVerses.push(versesMap.get(v) || '');
      }
      chapters.push(chapterVerses);
      chapterCount += 1;
    }

    books.push({
      abbrev: 'fr_pdv',
      book: book.id,
      chapters,
    });
  }

  fs.writeFileSync(OUT, JSON.stringify(books));
  console.log(`\nTerminé : ${chapterCount} chapitres → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
