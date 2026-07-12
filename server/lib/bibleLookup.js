import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const CHAPTERS_DIR = path.join(ROOT, 'public', 'bible', 'chapters');
const LEXICON_PATH = path.join(ROOT, 'public', 'bible', 'lexicon.json');

/** Noms de livres FR/EN → id canonique */
const BOOK_ALIASES = {
  genese: 'genesis',
  genesis: 'genesis',
  exode: 'exodus',
  exodus: 'exodus',
  levitique: 'leviticus',
  leviticus: 'leviticus',
  nombres: 'numbers',
  numbers: 'numbers',
  deuteronome: 'deuteronomy',
  deuteronomy: 'deuteronomy',
  josue: 'joshua',
  joshua: 'joshua',
  juges: 'judges',
  judges: 'judges',
  ruth: 'ruth',
  '1 samuel': '1samuel',
  '1samuel': '1samuel',
  '2 samuel': '2samuel',
  '2samuel': '2samuel',
  '1 rois': '1kings',
  '1kings': '1kings',
  '2 rois': '2kings',
  '2kings': '2kings',
  '1 chroniques': '1chronicles',
  '1chronicles': '1chronicles',
  '2 chroniques': '2chronicles',
  '2chronicles': '2chronicles',
  esdras: 'ezra',
  ezra: 'ezra',
  nehemie: 'nehemiah',
  nehemiah: 'nehemiah',
  esther: 'esther',
  job: 'job',
  psaumes: 'psalms',
  psalm: 'psalms',
  psalms: 'psalms',
  proverbes: 'proverbs',
  proverbs: 'proverbs',
  ecclesiaste: 'ecclesiastes',
  ecclesiastes: 'ecclesiastes',
  cantique: 'songofsolomon',
  songofsolomon: 'songofsolomon',
  isaie: 'isaiah',
  isaiah: 'isaiah',
  jeremie: 'jeremiah',
  jeremiah: 'jeremiah',
  lamentations: 'lamentations',
  ezechiel: 'ezekiel',
  ezekiel: 'ezekiel',
  daniel: 'daniel',
  osee: 'hosea',
  hosea: 'hosea',
  joel: 'joel',
  amos: 'amos',
  abdias: 'obadiah',
  obadiah: 'obadiah',
  jonas: 'jonah',
  jonah: 'jonah',
  michee: 'micah',
  micah: 'micah',
  nahum: 'nahum',
  habacuc: 'habakkuk',
  habakkuk: 'habakkuk',
  sophonie: 'zephaniah',
  zephaniah: 'zephaniah',
  aggee: 'haggai',
  haggai: 'haggai',
  zacharie: 'zechariah',
  zechariah: 'zechariah',
  malachie: 'malachi',
  malachi: 'malachi',
  matthieu: 'matthew',
  matthew: 'matthew',
  marc: 'mark',
  mark: 'mark',
  luc: 'luke',
  luke: 'luke',
  jean: 'john',
  john: 'john',
  actes: 'acts',
  acts: 'acts',
  romains: 'romans',
  romans: 'romans',
  '1 corinthiens': '1corinthians',
  '1corinthians': '1corinthians',
  '2 corinthiens': '2corinthians',
  '2corinthians': '2corinthians',
  galates: 'galatians',
  galatians: 'galatians',
  ephesiens: 'ephesians',
  ephesians: 'ephesians',
  philippiens: 'philippians',
  philippians: 'philippians',
  colossiens: 'colossians',
  colossians: 'colossians',
  '1 thessaloniciens': '1thessalonians',
  '1thessalonians': '1thessalonians',
  '2 thessaloniciens': '2thessalonians',
  '2thessalonians': '2thessalonians',
  '1 timothee': '1timothy',
  '1timothy': '1timothy',
  '2 timothee': '2timothy',
  '2timothy': '2timothy',
  tite: 'titus',
  titus: 'titus',
  philemon: 'philemon',
  hebreux: 'hebrews',
  hebrews: 'hebrews',
  jacques: 'james',
  james: 'james',
  '1 pierre': '1peter',
  '1peter': '1peter',
  '2 pierre': '2peter',
  '2peter': '2peter',
  '1 jean': '1john',
  '1john': '1john',
  '2 jean': '2john',
  '2john': '2john',
  '3 jean': '3john',
  '3john': '3john',
  jude: 'jude',
  apocalypse: 'revelation',
  revelation: 'revelation',
};

function normalizeBookName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\./g, '')
    .trim();
}

function resolveBookId(raw) {
  const key = normalizeBookName(raw);
  if (BOOK_ALIASES[key]) return BOOK_ALIASES[key];
  if (BOOK_ALIASES[key.replace(/\s+/g, '')]) return BOOK_ALIASES[key.replace(/\s+/g, '')];
  return null;
}

/** Détecte Romains 5:1, Jean 3:16, 1 Cor 13:4, etc. */
export function parseBibleReferences(text) {
  const refs = [];
  const normalizedText = text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

  const aliasEntries = Object.entries(BOOK_ALIASES)
    .filter(([alias]) => alias.length >= 3)
    .sort((a, b) => b[0].length - a[0].length);

  for (const [alias, bookId] of aliasEntries) {
    const aliasNorm = alias.normalize('NFD').replace(/\p{M}/gu, '');
    const re = new RegExp(
      `(?:^|[\\s(,;«"'])${aliasNorm.replace(/\s+/g, '\\s+')}\\s+(\\d{1,3})\\s*[:.](\\d{1,3})(?:\\s*[-–—]\\s*(\\d{1,3}))?`,
      'gi'
    );
    let m;
    while ((m = re.exec(normalizedText)) !== null) {
      const key = `${bookId}-${m[1]}-${m[2]}`;
      if (refs.some((r) => `${r.bookId}-${r.chapter}-${r.verse}` === key)) continue;
      refs.push({
        bookId,
        chapter: parseInt(m[1], 10),
        verse: parseInt(m[2], 10),
        verseEnd: m[3] ? parseInt(m[3], 10) : parseInt(m[2], 10),
        label: `${alias} ${m[1]}:${m[2]}`,
      });
    }
  }

  return refs.slice(0, 5);
}

let lexiconCache = null;

function loadLexiconEntry(strongId) {
  if (!lexiconCache) {
    if (!fs.existsSync(LEXICON_PATH)) return null;
    lexiconCache = JSON.parse(fs.readFileSync(LEXICON_PATH, 'utf8'));
  }
  return lexiconCache[strongId.toUpperCase()] || null;
}

async function loadChapterJson(bookId, chapter) {
  const rel = `bible/chapters/${bookId}/${chapter}.json`;
  const localPath = path.join(CHAPTERS_DIR, bookId, `${chapter}.json`);
  if (fs.existsSync(localPath)) {
    return JSON.parse(fs.readFileSync(localPath, 'utf8'));
  }
  const base = config.appPublicUrl || '';
  if (!base) return null;
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/${rel}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function pickLangBlock(chapterData, language) {
  const lang = language?.split('-')[0] || 'fr';
  const order = [lang, lang === 'fr' ? 'fr_pdv' : null, 'fr', 'fr_pdv', 'en'].filter(Boolean);
  for (const l of order) {
    if (chapterData[l]?.verses?.length) return { lang: l, verses: chapterData[l].verses };
  }
  const first = Object.keys(chapterData).find((k) => chapterData[k]?.verses?.length);
  return first ? { lang: first, verses: chapterData[first].verses } : null;
}

/** Retourne des pseudo-chunks RAG pour versets cités dans la question */
export async function lookupBibleContext(message, language = 'fr') {
  const refs = parseBibleReferences(message);
  const chunks = [];

  for (const ref of refs.slice(0, 3)) {
    const data = await loadChapterJson(ref.bookId, ref.chapter);
    if (!data) continue;
    const block = pickLangBlock(data, language);
    if (!block) continue;

    const lines = [];
    for (let v = ref.verse; v <= ref.verseEnd; v += 1) {
      const verse = block.verses.find((x) => x.id === v);
      if (!verse?.text) continue;
      const strongs = (verse.segments || [])
        .filter((s) => s.s)
        .map((s) => `${s.t.trim()} (${s.s})`)
        .slice(0, 12)
        .join(', ');
      lines.push(`${ref.label.split(/\d/)[0].trim()} ${ref.chapter}:${v} — ${verse.text}${strongs ? `\nMots Strong : ${strongs}` : ''}`);
    }
    if (!lines.length) continue;

    chunks.push({
      id: `bible-live-${ref.bookId}-${ref.chapter}-${ref.verse}`,
      chunk_text: lines.join('\n\n'),
      language: block.lang,
      metadata: {
        content_type: 'bible_strong',
        title: 'Bible Strong',
        chapter: `${ref.bookId} ${ref.chapter}:${ref.verse}`,
        source_priority: 95,
      },
      similarity: 1,
      _liveBible: true,
    });
  }

  return chunks;
}

/** Entrées lexique Strong mentionnées (G2424, H7225) */
export function lookupStrongLexicon(message, language = 'fr') {
  const ids = [...message.matchAll(/\b([GH]\d{1,5})\b/gi)].map((m) => m[1].toUpperCase());
  const lang = language?.split('-')[0] || 'fr';
  const chunks = [];

  for (const id of [...new Set(ids)].slice(0, 4)) {
    const entry = loadLexiconEntry(id);
    if (!entry) continue;
    const lemma = entry.lemma?.[lang] || entry.lemma?.fr || entry.lemma?.en || '';
    const gloss = entry.gloss?.[lang] || entry.gloss?.fr || entry.gloss?.en || '';
    chunks.push({
      id: `strong-live-${id}`,
      chunk_text: `Strong ${id} — ${lemma}\n${gloss}`,
      language: lang,
      metadata: {
        content_type: 'bible_strong',
        title: 'Bible Strong · Lexique',
        strong_id: id,
        source_priority: 92,
      },
      similarity: 1,
      _liveStrong: true,
    });
  }
  return chunks;
}
