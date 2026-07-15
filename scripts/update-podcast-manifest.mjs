/**
 * Scanne public/audio/podcasts/ et génère manifest.json (URLs audio/transcript par langue).
 * Usage: node scripts/update-podcast-manifest.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'audio', 'podcasts');
const LANGS = ['fr', 'en', 'es', 'nl', 'pt', 'ar'];
const LANG_SUFFIX = /^(.+)\.(en|es|nl|pt|ar)$/;

function readDurationFromTranscript(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.duration_seconds || null;
  } catch {
    return null;
  }
}

const CATALOG_SLUGS = new Set([
  'revenons-premier-amour',
  'puissance-grace-faiblesses',
  'tunique-couleurs-destinee',
  'resurrection-probleme-vue',
  'welcome-voice',
]);

function main() {
  if (!fs.existsSync(OUT_DIR)) {
    console.log('Dossier podcasts absent, manifest ignoré.');
    return;
  }

  const slugs = new Set(CATALOG_SLUGS);
  for (const name of fs.readdirSync(OUT_DIR)) {
    if (!name.endsWith('.mp3')) continue;
    const base = name.slice(0, -4);
    const m = base.match(LANG_SUFFIX);
    if (m) slugs.add(m[1]);
  }

  const manifest = {};
  for (const slug of slugs) {
    manifest[slug] = { audio: {}, transcript: {}, duration: {}, available: [] };
    for (const lang of LANGS) {
      const sfx = lang === 'fr' ? '' : `.${lang}`;
      const mp3Name = `${slug}${sfx}.mp3`;
      const trName = `${slug}${sfx}.transcript.json`;
      const mp3Path = path.join(OUT_DIR, mp3Name);
      const trPath = path.join(OUT_DIR, trName);

      if (fs.existsSync(mp3Path)) {
        manifest[slug].audio[lang] = `/audio/podcasts/${mp3Name}`;
        manifest[slug].available.push(lang);
        const dur = fs.existsSync(trPath) ? readDurationFromTranscript(trPath) : null;
        if (dur) manifest[slug].duration[lang] = dur;
      }
      if (fs.existsSync(trPath)) {
        manifest[slug].transcript[lang] = `/audio/podcasts/${trName}`;
      }
    }
    if (!manifest[slug].available.length) delete manifest[slug];
  }

  const outPath = path.join(OUT_DIR, 'manifest.json');
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(`✓ manifest.json · ${Object.keys(manifest).length} épisode(s)`);
}

main();
