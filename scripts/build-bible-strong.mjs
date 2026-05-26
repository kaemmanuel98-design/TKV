/**
 * Génère la Bible Strong complète (66 livres, 1189 chapitres) dans public/bible/
 * Sources : BSB+Strong (EN), thiagobodruk (FR/ES/PT/AR), getBible Statenvertaling (NL)
 *
 * Usage : npm run build:bible
 * Cache : scripts/.cache/bible/ (téléchargements)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BIBLE_BOOKS, BOOK_BY_USFM } from '../src/data/bible/books.js';
import { STRONG_LEXICON } from '../src/data/bible/lexiconSample.js';
import {
  LANG_ANCHORS,
  SURFACE_STRONG_HINTS,
  normalizeToken,
} from '../src/data/bible/strongAlignHints.js';
import { enrichLexiconFromStrongs } from './enrich-strongs-lexicon.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CACHE = path.join(__dirname, '.cache', 'bible');
const OUT = path.join(ROOT, 'public', 'bible');
const BSB_ZIP = path.join(CACHE, 'BSB_strongs_usj.zip');
const BSB_DIR = path.join(CACHE, 'bsb_strongs');
const FR_JSON = path.join(CACHE, 'fr_apee.json');
const ES_JSON = path.join(CACHE, 'es_rvr.json');
const PT_JSON = path.join(CACHE, 'pt_aa.json');
const AR_JSON = path.join(CACHE, 'ar_svd.json');
const NL_JSON = path.join(CACHE, 'nl_statenvertaling.json');
const BSB_URL =
  'https://github.com/BSB-publishing/bsb2usfm/releases/download/v5.2/BSB_strongs_usj.zip';
const THIAGO_BASE = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json';
const FR_URL = `${THIAGO_BASE}/fr_apee.json`;
const ES_URL = `${THIAGO_BASE}/es_rvr.json`;
const PT_URL = `${THIAGO_BASE}/pt_aa.json`;
const AR_URL = `${THIAGO_BASE}/ar_svd.json`;
const NL_URL = 'https://api.getbible.net/v2/statenvertaling.json';

const BIBLE_LANGS = ['fr', 'en', 'es', 'nl', 'pt', 'ar'];

const GLOSS_BY_LANG = {
  fr: (id, s) => `Mot original (${id})${s ? ` — « ${s} »` : ''}.`,
  en: (id, s) => `Original language word (${id})${s ? ` — "${s}"` : ''}.`,
  es: (id, s) => `Palabra en lengua original (${id})${s ? ` — «${s}»` : ''}.`,
  nl: (id, s) => `Oorspronkelijk woord (${id})${s ? ` — «${s}»` : ''}.`,
  pt: (id, s) => `Palavra na língua original (${id})${s ? ` — «${s}»` : ''}.`,
  ar: (id, s) => `كلمة أصلية (${id})${s ? ` — «${s}»` : ''}.`,
};

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

async function download(url, dest) {
  if (fs.existsSync(dest)) return;
  ensureDir(path.dirname(dest));
  console.log(`  ↓ ${path.basename(dest)}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

function joinContent(content) {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(joinContent).join('');
  if (typeof content === 'object') return joinContent(content.content);
  return '';
}

function mergeSegments(segments) {
  const out = [];
  for (const seg of segments) {
    if (!seg.t) continue;
    const prev = out[out.length - 1];
    if (prev && prev.s === seg.s && prev.s === null) {
      prev.t += seg.t;
    } else if (prev && prev.s === null && seg.s === null) {
      prev.t += seg.t;
    } else {
      out.push({ ...seg });
    }
  }
  return out;
}

function segmentsToVerse(id, segments) {
  const merged = mergeSegments(segments);
  const text = merged.map((s) => s.t).join('');
  return { id, segments: merged, text };
}

/** Parse un fichier USJ BSB → Map<chapter, Map<verse, segments[]>> */
function parseUsjFile(filePath) {
  const root = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const chapters = new Map();

  const state = {
    chapter: null,
    verse: null,
    buffer: [],
    verses: null,
  };

  function flushVerse() {
    if (state.chapter == null || state.verse == null || !state.buffer.length) {
      state.buffer = [];
      return;
    }
    if (!state.verses) state.verses = new Map();
    const existing = state.verses.get(state.verse) || [];
    const verse = segmentsToVerse(state.verse, [...existing, ...state.buffer]);
    state.verses.set(state.verse, verse.segments);
    state.buffer = [];
  }

  function endChapter() {
    flushVerse();
    if (state.chapter != null && state.verses?.size) {
      chapters.set(state.chapter, state.verses);
    }
    state.verses = null;
    state.verse = null;
    state.buffer = [];
  }

  function walk(nodes) {
    if (!nodes) return;
    const list = Array.isArray(nodes) ? nodes : [nodes];
    for (const node of list) {
      if (node == null) continue;
      if (typeof node === 'string') {
        if (state.verse != null) state.buffer.push({ t: node, s: null });
        continue;
      }
      if (node.type === 'chapter') {
        endChapter();
        state.chapter = parseInt(node.number, 10);
        continue;
      }
      if (node.type === 'verse') {
        flushVerse();
        state.verse = parseInt(node.number, 10);
        continue;
      }
      if (node.type === 'char' && node.marker === 'w') {
        const t = joinContent(node.content);
        const s = node.strong || null;
        if (state.verse != null) state.buffer.push({ t, s });
        continue;
      }
      if (node.type === 'para' && state.chapter != null) {
        walk(node.content);
        flushVerse();
        continue;
      }
      if (node.content) walk(node.content);
    }
  }

  walk(root.content);
  endChapter();
  return chapters;
}

function tokenizeWords(text) {
  const words = [];
  const re = /[\p{L}\p{N}'’-]+/gu;
  let m;
  while ((m = re.exec(text)) !== null) {
    words.push({ word: m[0], index: m.index, end: m.index + m[0].length });
  }
  return words;
}

function flattenEnWords(enSegments) {
  const enWords = [];
  for (const seg of enSegments) {
    for (const p of tokenizeWords(seg.t)) {
      enWords.push({ word: p.word, lower: normalizeToken(p.word), s: seg.s });
    }
  }
  return enWords;
}

/**
 * Aligne les Strong EN sur une traduction (indices bibliques + paires EN↔langue).
 */
function alignLocalizedVerse(localText, enSegments, lang = 'fr') {
  const localWords = tokenizeWords(localText);
  if (!localWords.length) {
    return [{ t: localText, s: null }];
  }

  const hints = SURFACE_STRONG_HINTS[lang] || {};
  const anchors = LANG_ANCHORS[lang] || [];
  const assign = new Map();

  const assignWord = (frWord, strongId) => {
    if (!strongId || !frWord) return;
    assign.set(frWord, strongId);
  };

  for (const lw of localWords) {
    const key = normalizeToken(lw.word);
    if (hints[key]) assignWord(lw.word, hints[key]);
  }

  const enWords = flattenEnWords(enSegments);

  for (const anchor of anchors) {
    const frHit = localWords.find(
      (lw) => !assign.has(lw.word) && anchor.fr.includes(normalizeToken(lw.word))
    );
    if (!frHit) continue;
    const enHit = enWords.find((ew) => anchor.en.includes(ew.lower) && ew.s);
    if (enHit) assignWord(frHit.word, enHit.s);
  }

  for (const seg of enSegments) {
    if (!seg.s || [...assign.values()].includes(seg.s)) continue;

    const segEn = tokenizeWords(seg.t).map((p) => normalizeToken(p.word));
    let matched = false;

    for (const anchor of anchors) {
      if (!anchor.en.some((e) => segEn.includes(e))) continue;
      const frHit = localWords.find(
        (lw) => !assign.has(lw.word) && anchor.fr.includes(normalizeToken(lw.word))
      );
      if (frHit) {
        assignWord(frHit.word, seg.s);
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const enIdx = enWords.findIndex((ew) => segEn.includes(ew.lower));
    const ratio = enIdx >= 0 ? enIdx / Math.max(enWords.length, 1) : 0.5;
    const center = Math.round(ratio * (localWords.length - 1));
    for (let d = 0; d < localWords.length; d++) {
      let placed = false;
      for (const j of [center - d, center + d]) {
        if (j < 0 || j >= localWords.length) continue;
        const fw = localWords[j].word;
        if (assign.has(fw)) continue;
        assignWord(fw, seg.s);
        placed = true;
        break;
      }
      if (placed) break;
    }
  }

  return buildLocalizedSegments(localText, [...assign.entries()]);
}

function buildLocalizedSegments(text, highlightPairs) {
  if (!highlightPairs.length) return [{ t: text, s: null }];

  const sorted = highlightPairs
    .map(([w, s]) => ({ w, s, index: text.indexOf(w) }))
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

function collectLexiconFromSegments(segments, lexicon, wordGloss) {
  for (const seg of segments) {
    if (!seg.s) continue;
    if (lexicon[seg.s]) continue;
    const isGreek = seg.s.startsWith('G');
    const surface = seg.t.trim();
    lexicon[seg.s] = {
      lemma: Object.fromEntries(BIBLE_LANGS.map((l) => [l, surface])),
      gloss: Object.fromEntries(BIBLE_LANGS.map((l) => [l, GLOSS_BY_LANG[l](seg.s, surface)])),
      isGreek,
    };
    if (surface) wordGloss.set(seg.s, surface);
  }
}

function readJson(path) {
  let raw = fs.readFileSync(path, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return JSON.parse(raw);
}

function loadThiagobodrukBible(filePath) {
  return readJson(filePath);
}

function loadGetbibleNl() {
  const data = readJson(NL_JSON);
  const books = (data.books || [])
    .filter((b) => b.nr >= 1 && b.nr <= 66)
    .sort((a, b) => a.nr - b.nr);
  return books.map((book) => ({
    chapters: book.chapters.map((ch) => ch.verses.map((v) => (v.text || '').trim())),
  }));
}

function buildLocalizedVerse(vNum, localText, enSegments, fallbackText, lang) {
  const text = localText || fallbackText;
  const segments = localText ? alignLocalizedVerse(text, enSegments, lang) : enSegments;
  return { id: vNum, segments, text };
}

/** Ordre canonique des fichiers USJ (ne pas trier par entier — 091SA ≠ 19PSA). */
const USJ_FILES_CANONICAL = [
  '01GENBSB_strongs.usj',
  '02EXOBSB_strongs.usj',
  '03LEVBSB_strongs.usj',
  '04NUMBSB_strongs.usj',
  '05DEUBSB_strongs.usj',
  '06JOSBSB_strongs.usj',
  '07JDGBSB_strongs.usj',
  '08RUTBSB_strongs.usj',
  '091SABSB_strongs.usj',
  '102SABSB_strongs.usj',
  '111KIBSB_strongs.usj',
  '122KIBSB_strongs.usj',
  '131CHBSB_strongs.usj',
  '142CHBSB_strongs.usj',
  '15EZRBSB_strongs.usj',
  '16NEHBSB_strongs.usj',
  '17ESTBSB_strongs.usj',
  '18JOBBSB_strongs.usj',
  '19PSABSB_strongs.usj',
  '20PROBSB_strongs.usj',
  '21ECCBSB_strongs.usj',
  '22SNGBSB_strongs.usj',
  '23ISABSB_strongs.usj',
  '24JERBSB_strongs.usj',
  '25LAMBSB_strongs.usj',
  '26EZKBSB_strongs.usj',
  '27DANBSB_strongs.usj',
  '28HOSBSB_strongs.usj',
  '29JOLBSB_strongs.usj',
  '30AMOBSB_strongs.usj',
  '31OBABSB_strongs.usj',
  '32JONBSB_strongs.usj',
  '33MICBSB_strongs.usj',
  '34NAMBSB_strongs.usj',
  '35HABBSB_strongs.usj',
  '36ZEPBSB_strongs.usj',
  '37HAGBSB_strongs.usj',
  '38ZECBSB_strongs.usj',
  '39MALBSB_strongs.usj',
  '41MATBSB_strongs.usj',
  '42MRKBSB_strongs.usj',
  '43LUKBSB_strongs.usj',
  '44JHNBSB_strongs.usj',
  '45ACTBSB_strongs.usj',
  '46ROMBSB_strongs.usj',
  '471COBSB_strongs.usj',
  '482COBSB_strongs.usj',
  '49GALBSB_strongs.usj',
  '50EPHBSB_strongs.usj',
  '51PHPBSB_strongs.usj',
  '52COLBSB_strongs.usj',
  '531THBSB_strongs.usj',
  '542THBSB_strongs.usj',
  '551TIBSB_strongs.usj',
  '562TIBSB_strongs.usj',
  '57TITBSB_strongs.usj',
  '58PHMBSB_strongs.usj',
  '59HEBBSB_strongs.usj',
  '60JASBSB_strongs.usj',
  '611PEBSB_strongs.usj',
  '622PEBSB_strongs.usj',
  '631JNBSB_strongs.usj',
  '642JNBSB_strongs.usj',
  '653JNBSB_strongs.usj',
  '66JUDBSB_strongs.usj',
  '67REVBSB_strongs.usj',
];

function listUsjFiles() {
  const onDisk = new Set(fs.readdirSync(BSB_DIR).filter((f) => f.endsWith('.usj')));
  return USJ_FILES_CANONICAL.filter((f) => onDisk.has(f));
}

async function main() {
  console.log('TKV — build Bible Strong (66 livres)\n');

  ensureDir(CACHE);
  ensureDir(OUT);
  ensureDir(path.join(OUT, 'chapters'));

  if (!fs.existsSync(BSB_DIR) || !fs.readdirSync(BSB_DIR).length) {
    if (!fs.existsSync(BSB_ZIP)) {
      console.log('Téléchargement BSB + Strong…');
      await download(BSB_URL, BSB_ZIP);
    }
    console.log('Extraction BSB USJ…');
    const { execSync } = await import('child_process');
    ensureDir(BSB_DIR);
    execSync(
      `powershell -Command "Expand-Archive -Force '${BSB_ZIP.replace(/'/g, "''")}' '${BSB_DIR.replace(/'/g, "''")}'"`,
      { stdio: 'inherit' }
    );
  }

  const downloads = [
    [FR_URL, FR_JSON, 'FR (Épée)'],
    [ES_URL, ES_JSON, 'ES (RVR)'],
    [PT_URL, PT_JSON, 'PT (Almeida)'],
    [AR_URL, AR_JSON, 'AR (Van Dyck)'],
    [NL_URL, NL_JSON, 'NL (Statenvertaling)'],
  ];
  for (const [url, dest, label] of downloads) {
    if (!fs.existsSync(dest)) {
      console.log(`Téléchargement Bible ${label}…`);
      await download(url, dest);
    }
  }

  const localizedSources = {
    fr: loadThiagobodrukBible(FR_JSON),
    es: loadThiagobodrukBible(ES_JSON),
    pt: loadThiagobodrukBible(PT_JSON),
    ar: loadThiagobodrukBible(AR_JSON),
    nl: loadGetbibleNl(),
  };
  const usjFiles = listUsjFiles();
  if (usjFiles.length !== BIBLE_BOOKS.length) {
    console.warn(`  ⚠ ${usjFiles.length} fichiers USJ vs ${BIBLE_BOOKS.length} livres`);
  }
  const lexicon = { ...STRONG_LEXICON };
  const wordGloss = new Map();
  let chapterCount = 0;

  for (let bi = 0; bi < BIBLE_BOOKS.length; bi += 1) {
    const book = BIBLE_BOOKS[bi];
    const usjName = usjFiles[bi];
    if (!usjName) {
      console.warn(`  ⚠ USJ manquant pour ${book.id}`);
      continue;
    }
    const usjPath = path.join(BSB_DIR, usjName);

    const enChapters = parseUsjFile(usjPath);
    const bookDir = path.join(OUT, 'chapters', book.id);
    ensureDir(bookDir);

    for (let ch = 1; ch <= book.chapters; ch += 1) {
      const enVersesMap = enChapters.get(ch);

      if (!enVersesMap?.size) continue;

      const payload = {};
      const verseNums = [...enVersesMap.keys()].sort((a, b) => a - b);

      const enVerses = [];
      for (const vNum of verseNums) {
        const enSegs = enVersesMap.get(vNum);
        const enVerse = segmentsToVerse(vNum, enSegs);
        enVerses.push({ id: vNum, segments: enVerse.segments, text: enVerse.text });
        collectLexiconFromSegments(enVerse.segments, lexicon, wordGloss);
      }
      payload.en = { verses: enVerses };

      for (const lang of BIBLE_LANGS) {
        if (lang === 'en') continue;
        const chapterTexts = localizedSources[lang]?.[bi]?.chapters?.[ch - 1];
        const langVerses = [];
        for (const vNum of verseNums) {
          const enSegs = enVersesMap.get(vNum);
          const enVerse = segmentsToVerse(vNum, enSegs);
          const localText = chapterTexts?.[vNum - 1];
          const verse = buildLocalizedVerse(vNum, localText, enVerse.segments, enVerse.text, lang);
          langVerses.push(verse);
          collectLexiconFromSegments(verse.segments, lexicon, wordGloss);
        }
        payload[lang] = { verses: langVerses };
      }
      fs.writeFileSync(path.join(bookDir, `${ch}.json`), JSON.stringify(payload));
      chapterCount += 1;
    }
    console.log(`  ✓ ${book.id} (${book.chapters} ch.)`);
  }

  const manifest = {
    version: 1,
    books: BIBLE_BOOKS.map((b) => ({ id: b.id, chapters: b.chapters, testament: b.testament })),
    chapterCount,
    languages: BIBLE_LANGS,
    sources: {
      en: 'Berean Standard Bible with Strong (public domain)',
      fr: 'Bible de l\'Épée (thiagobodruk/bible)',
      es: 'Reina-Valera (thiagobodruk/bible)',
      pt: 'Almeida Atualizada (thiagobodruk/bible)',
      ar: 'Smith-Van Dyck (thiagobodruk/bible)',
      nl: 'Statenvertaling (getBible API)',
    },
  };

  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log('\nEnrichissement lexique Strong (définitions originales)…');
  const enrichedLexicon = await enrichLexiconFromStrongs(lexicon, STRONG_LEXICON);
  fs.writeFileSync(path.join(OUT, 'lexicon.json'), JSON.stringify(enrichedLexicon));

  console.log(`\nTerminé : ${chapterCount} chapitres → public/bible/`);
  console.log(`Lexique : ${Object.keys(lexicon).length} entrées Strong`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

