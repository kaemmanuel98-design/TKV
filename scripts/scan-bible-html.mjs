import fs from 'fs';
import path from 'path';

const root = path.join(process.cwd(), 'public/bible/chapters');
const htmlRe = /<\/?span|<\/?div|class="(?:w|content)"/;
const tagRe = /<[^>]{1,120}>/g;

const hits = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith('.json')) {
      const raw = fs.readFileSync(p, 'utf8');
      if (htmlRe.test(raw)) {
        const samples = [...raw.matchAll(tagRe)].slice(0, 5).map((m) => m[0]);
        hits.push({
          rel: path.relative(process.cwd(), p).replace(/\\/g, '/'),
          tagCount: (raw.match(/</g) || []).length,
          samples,
        });
      }
    }
  }
}

walk(root);
console.log(`files with html-like: ${hits.length}`);
for (const h of hits.slice(0, 30)) {
  console.log(h.rel, h.tagCount, h.samples.join(' | '));
}
