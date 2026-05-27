import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFParse } from 'pdf-parse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath =
  process.argv[2] ||
  path.join(process.env.USERPROFILE || '', 'Downloads', '1779384644407-eido.pdf');
const outPath = path.join(__dirname, '../src/data/eido_fr.js');

/** Titres en capitales dans le PDF — pas de flag /i (évite « Le renoncement… » dans l’intro). */
const SECTIONS = [
  { match: /^INTRODUCTION$/, title: 'Introduction' },
  { match: /^LE RENONCEMENT AUX ŒUVRES MORTES$/, title: 'Le renoncement aux œuvres mortes' },
  { match: /^LA FOI EN DIEU$/, title: 'La foi en Dieu' },
  { match: /^LA DOCTRINE DES BAPTÊMES$/, title: 'La doctrine des baptêmes' },
  { match: /^L'IMPOSITION DES MAINS$/, title: "L'imposition des mains" },
  { match: /^LA RÉSURRECTION DES MORTS$/, title: 'La résurrection des morts' },
  { match: /^LE JUGEMENT ÉTERNEL$/, title: 'Le jugement éternel' },
  { match: /^CONCLUSION$/, title: 'Conclusion' },
];

function normApostrophe(s) {
  return s.replace(/[\u2018\u2019\u2032]/g, "'");
}

function cleanLines(raw) {
  return raw
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => normApostrophe(l.trim()))
    .filter((line) => {
      if (!line) return false;
      if (/^EIDO\s*[—–-]\s*\d+$/i.test(line)) return false;
      if (/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line)) return false;
      if (/^Sommaire$/i.test(line)) return false;
      if (/^•\s/.test(line)) return false;
      return true;
    });
}

function findSectionIndex(lines, section, from = 0) {
  for (let i = from; i < lines.length; i++) {
    if (section.match.test(lines[i])) return i;
  }
  return -1;
}

const buffer = fs.readFileSync(pdfPath);
const parser = new PDFParse({ data: buffer });
const result = await parser.getText();
await parser.destroy();

const lines = cleanLines(result.text || '');
const starts = [];

for (const section of SECTIONS) {
  const from = starts.length ? starts[starts.length - 1].index + 1 : 0;
  const index = findSectionIndex(lines, section, from);
  if (index >= 0) starts.push({ ...section, index });
}

if (starts.length < SECTIONS.length) {
  console.error('Missing sections:', SECTIONS.length - starts.length);
  process.exit(1);
}

const chapters = starts.map((start, i) => {
  const end = i + 1 < starts.length ? starts[i + 1].index : lines.length;
  const body = lines
    .slice(start.index + 1, end)
    .filter((line) => !SECTIONS.some((s) => s.match.test(line)));
  return {
    title: start.title,
    content: body.join('\n\n'),
    quiz: [],
  };
});

const book = {
  title: 'EIDO',
  subtitle: 'Les piliers du fondement du message de Christ',
  author: 'Ange Emmanuel Kouamé',
  chapters,
};

const fileContent = `export const BOOK_DATA = ${JSON.stringify(book, null, 2)};\n`;
fs.writeFileSync(outPath, fileContent, 'utf-8');
console.log(`Wrote ${outPath} — ${chapters.length} chapters`);
chapters.forEach((c, i) => console.log(`  ${i + 1}. ${c.title} (${c.content.length} chars)`));
