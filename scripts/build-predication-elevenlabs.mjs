/**
 * Génère une prédication / enseignement avec votre voix ElevenLabs (clone).
 *
 * Prérequis (.env) :
 *   ELEVENLABS_API_KEY=...
 *   ELEVENLABS_VOICE_ID=...   ← ID de votre voix clonée
 *
 * Usage :
 *   node scripts/build-predication-elevenlabs.mjs --slug=revenons-premier-amour
 *   node scripts/build-predication-elevenlabs.mjs --file=scripts/content/mon-texte.txt --slug=mon-episode --title="Mon titre"
 *   node scripts/list-elevenlabs-voices.mjs
 *
 * Options :
 *   --ambient        Piano très discret
 *   --music          Piano un peu plus présent
 *   --no-polish      Désactive l'écho de salle léger
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { elevenlabsConfigured } from '../server/lib/elevenlabsTts.js';
import { synthesizeFromText } from './lib/synthesizeElevenLabsPodcast.mjs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'audio', 'podcasts');
const CONTENT_DIR = path.join(ROOT, 'scripts', 'content');

function parseArgs(argv) {
  const opts = { ambient: false, music: false, polish: true, lang: 'fr' };
  for (const arg of argv) {
    if (arg.startsWith('--file=')) opts.file = arg.slice(7).trim();
    else if (arg.startsWith('--slug=')) opts.slug = arg.slice(7).trim();
    else if (arg.startsWith('--title=')) opts.title = arg.slice(8).trim();
    else if (arg.startsWith('--desc=')) opts.desc = arg.slice(7).trim();
    else if (arg.startsWith('--lang=')) opts.lang = arg.slice(7).trim();
    else if (arg === '--ambient') opts.ambient = true;
    else if (arg === '--music') opts.music = true;
    else if (arg === '--no-polish') opts.polish = false;
    else if (arg === '--no-music') opts.ambient = false;
  }
  return opts;
}

function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

function mixAmbient(voiceMp3, finalMp3, level = 0.055) {
  const res = spawnSync(
    process.execPath,
    [
      path.join(ROOT, 'scripts/mix-podcast-music.mjs'),
      voiceMp3,
      `--out=${finalMp3}`,
      `--level=${level}`,
    ],
    { encoding: 'utf8', maxBuffer: 80 * 1024 * 1024 }
  );
  if (res.status !== 0) {
    console.warn('Mix ambient ignoré, voix seule conservée.');
    fs.copyFileSync(voiceMp3, finalMp3);
  }
}

async function main() {
  if (!elevenlabsConfigured()) {
    console.error(
      'Configurez ELEVENLABS_API_KEY et ELEVENLABS_VOICE_ID dans .env\n' +
        'Liste des voix : node scripts/list-elevenlabs-voices.mjs'
    );
    process.exit(1);
  }

  const opts = parseArgs(process.argv.slice(2));
  const lang = opts.lang?.split('-')[0] || 'fr';

  let filePath = opts.file ? path.resolve(opts.file) : null;
  if (!filePath && opts.slug) {
    filePath = path.join(CONTENT_DIR, `${opts.slug}.txt`);
  }
  if (!filePath || !fs.existsSync(filePath)) {
    console.error('Fichier texte introuvable. --file=... ou --slug=... avec scripts/content/<slug>.txt');
    process.exit(1);
  }

  const slug = opts.slug || slugify(path.basename(filePath, '.txt'));
  const title = opts.title || slug.replace(/-/g, ' ');
  const raw = fs.readFileSync(filePath, 'utf8');

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const voiceOnly = path.join(OUT_DIR, `${slug}.voice-only.mp3`);
  const finalMp3 = path.join(OUT_DIR, `${slug}.mp3`);

  console.log(`Prédication ElevenLabs · ${title}`);
  console.log(`Voix : ${process.env.ELEVENLABS_VOICE_ID}`);
  console.log(`Style chaire · prises longues · polish ${opts.polish ? 'on' : 'off'}\n`);

  const result = await synthesizeFromText({
    rawText: raw,
    lang,
    outPath: voiceOnly,
    polish: opts.polish,
    onProgress: ({ index, total, chars }) => {
      process.stdout.write(`  prise ${index}/${total} (${chars} car.)…\n`);
    },
  });

  if (opts.music || opts.ambient) {
    mixAmbient(voiceOnly, finalMp3, opts.music ? 0.09 : 0.055);
  } else {
    fs.copyFileSync(voiceOnly, finalMp3);
  }

  const { duration, paragraphs, chapters, summary } = result;

  const transcript = {
    slug,
    language: lang,
    duration_seconds: Math.round(duration),
    source: 'predication',
    content_type: 'sermon',
    tts_engine: 'elevenlabs',
    voice_id: process.env.ELEVENLABS_VOICE_ID,
    created_at: new Date().toISOString(),
    summary,
    chapters: chapters.length ? chapters : [{ start: 0, title: 'Introduction' }],
    segments: paragraphs.map((p, id) => ({ id, ...p })),
    paragraphs,
  };

  fs.writeFileSync(path.join(OUT_DIR, `${slug}.transcript.json`), JSON.stringify(transcript, null, 2));
  fs.writeFileSync(
    path.join(OUT_DIR, `${slug}.transcript.txt`),
    paragraphs.map((p) => p.text).join('\n\n'),
    'utf8'
  );
  fs.writeFileSync(
    path.join(OUT_DIR, `${slug}.json`),
    JSON.stringify(
      {
        slug,
        title,
        description: opts.desc || summary,
        audio_url: `/audio/podcasts/${slug}.mp3`,
        transcript_url: `/audio/podcasts/${slug}.transcript.json`,
        duration_seconds: Math.round(duration),
        language: lang,
        is_premium: false,
        content_type: 'sermon',
        tts_engine: 'elevenlabs',
        created_at: new Date().toISOString(),
      },
      null,
      2
    )
  );

  spawnSync(process.execPath, [path.join(ROOT, 'scripts/update-podcast-manifest.mjs')], {
    stdio: 'inherit',
  });

  console.log(`\n✓ Prédication prête (${Math.round(duration)}s)`);
  console.log(`  ${finalMp3}`);
  console.log('\nProchaines étapes :');
  console.log('  1. Écoutez — ajustez ELEVENLABS_STABILITY (0.25–0.38) si besoin');
  console.log('  2. node scripts/build-multilang-podcast-audio.mjs --slug=' + slug);
  console.log('  3. npx vercel deploy --prod');
}

main().catch((err) => {
  console.error(err?.detail || err?.message || err);
  process.exit(1);
});
