import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFParse } from 'pdf-parse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath =
  process.argv[2] ||
  path.join(process.env.USERPROFILE || '', 'Downloads', '1779384644407-eido.pdf');

const buffer = fs.readFileSync(pdfPath);
const parser = new PDFParse({ data: buffer });
const result = await parser.getText();
await parser.destroy();

const text = result.text || '';
const lines = text
  .replace(/\r/g, '')
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);

const chapterRe =
  /^(?:CHAPITRE|Chapitre|CHAPTER|Chapter)\s+(\d+|[IVXLC]+)\s*[:\.\-–—]?\s*(.+)$/i;
const headingRe =
  /^(?:PARTIE|Partie|PART|Part)\s+(\d+|[IVXLC]+)\s*[:\.\-–—]?\s*(.+)$/i;
const pillarRe = /^PILIER\s+(\d+)\s*[:\.\-–—]?\s*(.+)$/i;

const markers = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (chapterRe.test(line) || headingRe.test(line) || pillarRe.test(line)) {
    markers.push({ index: i, line });
  }
}

console.log(`Lines: ${lines.length}, markers: ${markers.length}`);
console.log('First 50 lines:');
lines.slice(0, 50).forEach((l, i) => console.log(`${i + 1}: ${l}`));
console.log('\nMarkers:');
markers.forEach((c) => console.log(c.line));

const outPath = path.join(__dirname, '../eido-extract-sample.txt');
fs.writeFileSync(outPath, text.slice(0, 8000), 'utf-8');
console.log(`\nWrote ${outPath}`);
