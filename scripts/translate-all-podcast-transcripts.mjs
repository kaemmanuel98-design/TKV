/**
 * Traduit tous les transcripts podcast manquants.
 * Usage: node scripts/translate-all-podcast-transcripts.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { PODCAST_CATALOG } from '../src/data/podcastsCatalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TARGETS = ['en', 'es', 'nl', 'pt', 'ar'];

function needsTranslation(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const paras = data.paragraphs?.length || 0;
  if (!paras) return false;
  return TARGETS.some((l) => data.translations?.[l]?.paragraphs?.length !== paras);
}

async function main() {
  const files = PODCAST_CATALOG.filter((ep) => ep.transcript_url)
    .map((ep) => path.join(ROOT, 'public', ep.transcript_url.replace(/^\//, '')))
    .filter((f) => fs.existsSync(f) && needsTranslation(f))
    .sort((a, b) => {
      const pa = JSON.parse(fs.readFileSync(a, 'utf8')).paragraphs?.length || 0;
      const pb = JSON.parse(fs.readFileSync(b, 'utf8')).paragraphs?.length || 0;
      return pa - pb;
    });

  if (!files.length) {
    console.log('Tous les transcripts sont déjà traduits.');
    return;
  }

  let failed = 0;
  for (const file of files) {
    console.log(`\n→ ${path.basename(file)}`);
    const res = spawnSync(process.execPath, [path.join(ROOT, 'scripts/translate-podcast-transcript.mjs'), file], {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
      stdio: 'inherit',
    });
    if (res.status !== 0) {
      console.error(`Échec partiel: ${file}`);
      failed += 1;
    }
    await new Promise((r) => setTimeout(r, 45000));
  }

  if (failed) {
    console.error(`\n${failed} transcript(s) incomplet(s) — relancez le script plus tard.`);
    process.exit(1);
  }

  console.log('\n✓ Toutes les traductions podcast sont à jour.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
