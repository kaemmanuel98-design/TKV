import fs from 'fs';
import { PDFParse } from 'pdf-parse';

const buf = fs.readFileSync('c:/Users/Ange/Downloads/1779384644407-eido.pdf');
const p = new PDFParse({ data: buf });
const r = await p.getText();
await p.destroy();

function normApostrophe(s) {
  return s.replace(/[\u2018\u2019\u2032]/g, "'");
}
const lines = r.text
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

lines.forEach((l, i) => {
  if (/^LE RENONCEMENT/i.test(l)) console.log('REN', i, l);
});
console.log('--- 25-85 ---');
for (let i = 25; i < 85; i++) console.log(i, lines[i]?.slice(0, 75));
