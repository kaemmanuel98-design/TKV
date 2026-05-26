/**
 * Enrichit le lexique TKV avec Open Scriptures (Strong hébreu + grec, CC-BY-SA).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(__dirname, '.cache', 'bible');
const HEBREW_URL =
  'https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js';
const GREEK_URL =
  'https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js';
const HEBREW_FILE = path.join(CACHE, 'strongs-hebrew-dictionary.js');
const GREEK_FILE = path.join(CACHE, 'strongs-greek-dictionary.js');

const BIBLE_LANGS = ['fr', 'en', 'es', 'nl', 'pt', 'ar'];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

async function download(url, dest) {
  if (fs.existsSync(dest)) return;
  ensureDir(path.dirname(dest));
  console.log(`  ↓ ${path.basename(dest)} (Strong)`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${url}: ${res.status}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

function parseStrongsJsFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const match = text.match(/=\s*(\{[\s\S]*\})\s*;\s*module\.exports/);
  if (!match) throw new Error(`Cannot parse Strong dictionary: ${filePath}`);
  return JSON.parse(match[1]);
}

function normalizeStrongsId(key) {
  const letter = key[0];
  const num = parseInt(key.slice(1), 10);
  if (Number.isNaN(num)) return key;
  return `${letter}${num}`;
}

function convertOpenScripturesEntry(raw, isGreek) {
  const def = (raw.strongs_def || raw.kjv_def || '').trim();
  const gloss = Object.fromEntries(BIBLE_LANGS.map((l) => [l, def]));

  return {
    lemma: {
      original: raw.lemma || '',
      he: isGreek ? undefined : raw.lemma,
      gr: isGreek ? raw.lemma : undefined,
      translit: raw.xlit || '',
    },
    translit: raw.xlit || '',
    pron: raw.pron || '',
    derivation: (raw.derivation || '').trim(),
    strongsDef: def,
    kjvDef: (raw.kjv_def || '').trim(),
    gloss,
    isGreek,
  };
}

function mergeEntry(base, incoming, curated) {
  const gloss = { ...incoming.gloss, ...(base?.gloss || {}) };
  if (curated?.gloss) {
    for (const lang of BIBLE_LANGS) {
      if (curated.gloss[lang]) gloss[lang] = curated.gloss[lang];
    }
  }

  const lemma = {
    ...incoming.lemma,
    ...(base?.lemma || {}),
    ...(curated?.lemma || {}),
    original: incoming.lemma?.original || curated?.lemma?.original || base?.lemma?.original,
    translit: incoming.translit || curated?.lemma?.translit || base?.lemma?.translit,
  };

  return {
    ...incoming,
    ...base,
    lemma,
    gloss,
    strongsDef: incoming.strongsDef || base?.strongsDef,
    kjvDef: incoming.kjvDef || base?.kjvDef,
    translit: incoming.translit || base?.translit,
    pron: incoming.pron || base?.pron,
    derivation: incoming.derivation || base?.derivation,
    isGreek: incoming.isGreek ?? base?.isGreek,
  };
}

export async function enrichLexiconFromStrongs(lexicon, curatedSample = {}) {
  ensureDir(CACHE);
  await download(HEBREW_URL, HEBREW_FILE);
  await download(GREEK_URL, GREEK_FILE);

  const hebrew = parseStrongsJsFile(HEBREW_FILE);
  const greek = parseStrongsJsFile(GREEK_FILE);

  const out = { ...lexicon };
  let added = 0;

  for (const [key, raw] of Object.entries({ ...hebrew, ...greek })) {
    const id = normalizeStrongsId(key);
    const isGreek = id.startsWith('G');
    const incoming = convertOpenScripturesEntry(raw, isGreek);
    out[id] = mergeEntry(out[id], incoming, curatedSample[id]);
    added += 1;
  }

  console.log(`  Lexique Strong enrichi : ${added} entrées Open Scriptures`);
  return out;
}
