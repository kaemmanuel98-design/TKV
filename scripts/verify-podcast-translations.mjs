/**
 * Vérifie les traductions podcast (i18n titres + transcriptions pré-générées).
 * Usage: node scripts/verify-podcast-translations.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PODCAST_CATALOG } from '../src/data/podcastsCatalog.js';
import { cdcKeys } from '../src/i18n/cdcKeys.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const LANGS = ['fr', 'en', 'es', 'nl', 'pt', 'ar'];
const TARGETS = ['en', 'es', 'nl', 'pt', 'ar'];

function transcriptPath(url) {
  return path.join(ROOT, 'public', url.replace(/^\//, ''));
}

function auditTranscript(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const paras = data.paragraphs?.length || 0;
  const tr = data.translations || {};
  const langs = TARGETS.map((l) => {
    const count = tr[l]?.paragraphs?.length || 0;
    return { lang: l, ok: count === paras && paras > 0, count, paras };
  });
  return { slug: path.basename(filePath, '.transcript.json'), paras, langs };
}

async function main() {
  const keys = cdcKeys;
  let issues = 0;

  console.log('=== Titres / descriptions (i18n) ===');
  for (const ep of PODCAST_CATALOG) {
    if (!ep.titleKey || !ep.descKey) {
      console.log(`✗ ${ep.slug}: titleKey/descKey manquant`);
      issues += 1;
      continue;
    }
    for (const lang of LANGS) {
      const pack = keys[lang];
      if (!pack?.[ep.titleKey] || !pack?.[ep.descKey]) {
        console.log(`✗ ${ep.slug} · ${lang}: clé i18n manquante`);
        issues += 1;
      }
    }
    console.log(`✓ ${ep.slug} · i18n OK (${LANGS.length} langues)`);
  }

  console.log('\n=== Transcriptions pré-traduites ===');
  for (const ep of PODCAST_CATALOG) {
    if (!ep.transcript_url) continue;
    const file = transcriptPath(ep.transcript_url);
    if (!fs.existsSync(file)) {
      console.log(`✗ ${ep.slug}: transcript introuvable`);
      issues += 1;
      continue;
    }
    const audit = auditTranscript(file);
    const missing = audit.langs.filter((l) => !l.ok);
    if (missing.length) {
      console.log(
        `✗ ${audit.slug} (${audit.paras} paragraphes): ${missing.map((m) => `${m.lang} ${m.count}/${m.paras}`).join(', ')}`
      );
      issues += 1;
    } else {
      console.log(`✓ ${audit.slug} · ${audit.paras} paragraphes · ${TARGETS.join(', ')}`);
    }
  }

  console.log(issues ? `\n${issues} problème(s) détecté(s).` : '\nToutes les traductions podcast sont OK.');
  process.exit(issues ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
