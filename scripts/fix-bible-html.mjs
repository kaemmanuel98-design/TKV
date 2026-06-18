/**
 * Nettoie le HTML résiduel dans les textes bibliques (cache PDV + chapitres publics).
 * Usage : node scripts/fix-bible-html.mjs [--rebuild]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CACHE_PDV = path.join(__dirname, '.cache', 'bible', 'fr_pdv.json');
const CHAPTERS_DIR = path.join(ROOT, 'public', 'bible', 'chapters');

const HTML_TAG_RE = /<[^>]*>/g;
const HTML_FRAGMENT_RE = /<\/?span|class="|content">|">/;

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

export function stripHtmlFromText(text) {
  if (!text || typeof text !== 'string') return text || '';
  const decoded = decodeHtmlEntities(text);
  const stripped = decoded.replace(HTML_TAG_RE, '');
  return stripped.replace(/\s+/g, ' ').trim();
}

function needsCleaning(text) {
  return HTML_FRAGMENT_RE.test(text || '');
}

function rebuildSegmentsFromText(text, segments) {
  const strongWords = segments
    .filter((s) => s.s && s.t && !needsCleaning(s.t))
    .map((s) => ({ w: s.t.trim(), s: s.s }))
    .filter((x) => x.w);

  if (!strongWords.length) return [{ t: text, s: null }];

  const sorted = strongWords
    .map(({ w, s }) => ({ w, s, index: text.indexOf(w) }))
    .filter((h) => h.index >= 0)
    .sort((a, b) => a.index - b.index);

  const out = [];
  let pos = 0;
  for (const { w, s, index } of sorted) {
    if (index < pos) continue;
    if (index > pos) out.push({ t: text.slice(pos, index), s: null });
    out.push({ t: w, s });
    pos = index + w.length;
  }
  if (pos < text.length) out.push({ t: text.slice(pos), s: null });
  return out.length ? out : [{ t: text, s: null }];
}

function cleanVerse(verse) {
  const cleanText = stripHtmlFromText(verse.text);
  const hadDirtySegments = (verse.segments || []).some((s) => needsCleaning(s.t));
  if (!needsCleaning(verse.text) && !hadDirtySegments) return { verse, changed: false };

  const segments = hadDirtySegments
    ? rebuildSegmentsFromText(cleanText, verse.segments)
    : verse.segments.map((s) => ({
        ...s,
        t: needsCleaning(s.t) ? stripHtmlFromText(s.t) : s.t,
      }));

  return {
    verse: { ...verse, text: cleanText, segments },
    changed: cleanText !== verse.text || hadDirtySegments,
  };
}

function cleanChapterFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed = false;
  for (const lang of Object.keys(data)) {
    const verses = data[lang]?.verses;
    if (!verses) continue;
    data[lang].verses = verses.map((v) => {
      const { verse, changed: c } = cleanVerse(v);
      if (c) changed = true;
      return verse;
    });
  }
  if (changed) fs.writeFileSync(filePath, JSON.stringify(data));
  return changed;
}

function cleanPdvCache() {
  if (!fs.existsSync(CACHE_PDV)) {
    console.log('Cache PDV absent, ignoré.');
    return 0;
  }
  const books = JSON.parse(fs.readFileSync(CACHE_PDV, 'utf8'));
  let count = 0;
  for (const book of books) {
    for (const chapter of book.chapters) {
      for (let i = 0; i < chapter.length; i += 1) {
        const clean = stripHtmlFromText(chapter[i]);
        if (clean !== chapter[i]) {
          chapter[i] = clean;
          count += 1;
        }
      }
    }
  }
  fs.writeFileSync(CACHE_PDV, JSON.stringify(books));
  return count;
}

function walkChapters(dir, fn) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkChapters(p, fn);
    else if (entry.name.endsWith('.json')) fn(p);
  }
}

async function main() {
  console.log('Nettoyage HTML Bible…\n');

  const pdvFixed = cleanPdvCache();
  console.log(`Cache fr_pdv : ${pdvFixed} versets corrigés`);

  let filesChanged = 0;
  walkChapters(CHAPTERS_DIR, (filePath) => {
    if (cleanChapterFile(filePath)) filesChanged += 1;
  });
  console.log(`Chapitres publics : ${filesChanged} fichiers corrigés`);

  if (process.argv.includes('--rebuild')) {
    console.log('\nRelance build:bible…');
    const { execSync } = await import('child_process');
    execSync('node scripts/build-bible-strong.mjs', { cwd: ROOT, stdio: 'inherit' });
  }

  // Vérification
  let remaining = 0;
  walkChapters(CHAPTERS_DIR, (filePath) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    if (HTML_FRAGMENT_RE.test(raw)) remaining += 1;
  });
  console.log(`\nFichiers encore pollués : ${remaining}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
