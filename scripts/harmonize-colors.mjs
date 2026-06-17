/**
 * Harmonise les couleurs hardcodées (or legacy) vers les tokens sémantiques globaux.
 * Usage: node scripts/harmonize-colors.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const srcDir = join(root, 'src');

const replacements = [
  // Or legacy rgba → tokens accent (UI) ou brand (identité)
  [/rgba\(201,\s*169,\s*98,\s*0\.04\)/g, 'var(--brand-subtle)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.06\)/g, 'var(--accent-subtle)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.08\)/g, 'var(--accent-soft)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.1\)/g, 'var(--accent-soft)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.12\)/g, 'var(--accent-soft)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.14\)/g, 'var(--accent-medium)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.15\)/g, 'var(--accent-medium)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.18\)/g, 'var(--accent-medium)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.2\)/g, 'var(--accent-medium)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.22\)/g, 'var(--accent-border)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.25\)/g, 'var(--accent-border)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.28\)/g, 'var(--accent-border)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.3\)/g, 'var(--accent-border)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.35\)/g, 'var(--accent-border-strong)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.38\)/g, 'var(--accent-border-strong)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.4\)/g, 'var(--accent-border-strong)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.42\)/g, 'var(--accent-border-strong)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.45\)/g, 'var(--accent-border-strong)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.5\)/g, 'var(--accent-border-strong)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.55\)/g, 'var(--accent-border-strong)'],
  [/rgba\(212,\s*175,\s*55,\s*0\.08\)/g, 'var(--brand-subtle)'],
  [/rgba\(212,\s*175,\s*55,\s*0\.15\)/g, 'var(--brand-medium)'],
  [/rgba\(212,\s*180,\s*86,\s*0\.2\)/g, 'var(--brand-medium)'],
  [/rgba\(212,\s*160,\s*90,\s*0\.9\)/g, 'var(--brand-text)'],
  [/rgba\(212,\s*160,\s*90,\s*0\.55\)/g, 'var(--brand-border-strong)'],
  [/rgba\(212,\s*140,\s*58,\s*0\.12\)/g, 'var(--brand-soft)'],
  [/rgba\(212,\s*160,\s*60,\s*0\.35\)/g, 'var(--brand-border)'],
  [/rgba\(212,\s*160,\s*60,\s*0\.1\)/g, 'var(--brand-soft)'],
  [/rgba\(212,\s*160,\s*60,\s*0\.08\)/g, 'var(--brand-subtle)'],
  [/#c9a962/gi, 'var(--gold)'],
  [/#C9A962/g, 'var(--gold)'],
  [/color:\s*var\(--gold-bright\)/g, 'color: var(--accent-text)'],
  [/border-color:\s*var\(--gold-bright\)/g, 'border-color: var(--accent-border-strong)'],
  [/border:\s*2px solid var\(--gold-bright\)/g, 'border: 2px solid var(--accent-border-strong)'],
  [/border-top-color:\s*var\(--gold-bright\)/g, 'border-top-color: var(--accent)'],
  [/background:\s*linear-gradient\(90deg,\s*var\(--gold-dim\),\s*var\(--gold-bright\)\)/g, 'background: var(--progress-fill)'],
  [/background:\s*linear-gradient\(90deg,\s*var\(--gold-bright\),\s*var\(--km-royal-bright\)\)/g, 'background: var(--progress-fill)'],
  [/filter:\s*drop-shadow\([^)]*201,\s*169,\s*98[^)]*\)/g, 'filter: none'],
  [/box-shadow:\s*0 0 0 2px rgba\(201,\s*169,\s*98,\s*0\.12\)/g, 'box-shadow: 0 0 0 2px var(--accent-ring)'],
  [/box-shadow:\s*0 0 0 2px rgba\(201,\s*169,\s*98,\s*0\.35\)/g, 'box-shadow: 0 0 0 2px var(--accent-ring)'],
  [/outline:\s*2px solid var\(--gold\)/g, 'outline: 2px solid var(--accent-ring)'],
  [/accent-color:\s*var\(--gold\)/g, 'accent-color: var(--accent)'],
  [/color:\s*var\(--gold\)/g, 'color: var(--accent-text)'],
  [/border-color:\s*var\(--gold\)/g, 'border-color: var(--accent-border-strong)'],
  [/border:\s*1px solid var\(--gold\)/g, 'border: 1px solid var(--accent-border-strong)'],
  [/border:\s*2px solid var\(--gold\)/g, 'border: 2px solid var(--accent-border-strong)'],
  [/border:\s*3px solid var\(--gold\)/g, 'border: 3px solid var(--accent-border-strong)'],
  [/border-left:\s*3px solid var\(--gold\)/g, 'border-left: 3px solid var(--accent-border)'],
  [/border-left:\s*4px solid var\(--gold\)/g, 'border-left: 4px solid var(--accent-border)'],
  [/border-right:\s*3px solid var\(--gold\)/g, 'border-right: 3px solid var(--accent-border)'],
  [/border-right:\s*4px solid var\(--gold\)/g, 'border-right: 4px solid var(--accent-border)'],
  [/border-bottom:\s*16px solid var\(--gold\)/g, 'border-bottom: 16px solid var(--accent)'],
  [/background:\s*var\(--gold\)/g, 'background: var(--accent)'],
  [/color:\s*var\(--teal-bright\)/g, 'color: var(--success)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.11\)/g, 'var(--hero-tint-warm)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.09\)/g, 'var(--accent-subtle)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.85\)/g, 'var(--brand-text)'],
  [/rgba\(201,\s*169,\s*98,\s*0\.6\)/g, 'var(--brand-medium)'],
  [/color:\s*var\(--gold-bright,\s*#e8c547\)/g, 'color: var(--brand-text)'],
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (name.endsWith('.css') && name !== 'index.css') files.push(path);
  }
  return files;
}

let changed = 0;
for (const file of walk(srcDir)) {
  let content = readFileSync(file, 'utf8');
  const original = content;
  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }
  if (content !== original) {
    writeFileSync(file, content, 'utf8');
    changed += 1;
    console.log('updated', relative(root, file));
  }
}

console.log(`Done — ${changed} file(s) harmonized.`);
