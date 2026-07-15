/**
 * Nettoie et optimise une prédication audio (réduction de bruit, voix, export MP3).
 *
 * Usage:
 *   node scripts/process-sermon-audio.mjs "chemin/vers/source.mp4"
 *   node scripts/process-sermon-audio.mjs "source.mp4" --slug=predication-2026-07-12 --title="Ma prédication"
 *
 * Sortie: public/audio/sermons/<slug>.mp3 + public/audio/sermons/<slug>.json (métadonnées)
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'audio', 'sermons');

/**
 * Chaîne ffmpeg orientée "voix" :
 * - coupe grondement + aigus agressifs
 * - réduit le bruit
 * - atténue l'effet "pièce" (écho/réverb) en coupant la queue entre phrases (gate)
 * - enlève la boue (200–400 Hz) souvent responsable de réverb perçue
 * - compresse, limite et normalise le loudness
 */
const AUDIO_FILTER = [
  'highpass=f=110',
  'lowpass=f=12000',
  'afftdn=nf=-22:nt=w',
  'equalizer=f=280:t=q:w=1.1:g=-4',
  'agate=threshold=-36dB:ratio=3.0:attack=8:release=240:range=0.25',
  'acompressor=threshold=-19dB:ratio=3.0:attack=6:release=220:makeup=2.5',
  'alimiter=limit=0.96',
  'loudnorm=I=-16:TP=-1.5:LRA=11',
].join(',');

function parseArgs(argv) {
  const positional = [];
  let slug = null;
  let title = null;
  for (const arg of argv) {
    if (arg.startsWith('--slug=')) slug = arg.slice(7).trim();
    else if (arg.startsWith('--title=')) title = arg.slice(8).trim();
    else positional.push(arg);
  }
  return { input: positional[0], slug, title };
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  if (res.status !== 0) {
    throw new Error(res.stderr || res.stdout || `Command failed: ${cmd}`);
  }
  return res.stdout;
}

function probe(file) {
  const raw = run(ffprobePath.path, [
    '-v',
    'error',
    '-show_entries',
    'format=duration,size,bit_rate',
    '-show_entries',
    'stream=codec_name,codec_type,sample_rate,channels',
    '-of',
    'json',
    file,
  ]);
  return JSON.parse(raw);
}

function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function defaultSlug(inputPath) {
  const base = path.basename(inputPath, path.extname(inputPath));
  const dateMatch = base.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) return `predication-${dateMatch[1]}`;
  return slugify(base) || `predication-${Date.now()}`;
}

async function main() {
  const { input, slug: slugArg, title: titleArg } = parseArgs(process.argv.slice(2));
  if (!input) {
    console.error('Usage: node scripts/process-sermon-audio.mjs <fichier-source> [--slug=...] [--title=...]');
    process.exit(1);
  }

  const inputPath = path.resolve(input);
  if (!fs.existsSync(inputPath)) {
    console.error(`Fichier introuvable: ${inputPath}`);
    process.exit(1);
  }

  if (!ffmpegPath) {
    console.error('ffmpeg-static indisponible');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const slug = slugArg || defaultSlug(inputPath);
  const outMp3 = path.join(OUT_DIR, `${slug}.mp3`);
  const outMeta = path.join(OUT_DIR, `${slug}.json`);

  console.log('Analyse du fichier source…');
  const before = probe(inputPath);
  const durationBefore = Math.round(parseFloat(before.format?.duration || 0));
  const sizeBefore = parseInt(before.format?.size || 0, 10);
  console.log(`  Durée: ${Math.floor(durationBefore / 60)} min ${durationBefore % 60} s`);
  console.log(`  Taille: ${(sizeBefore / 1024 / 1024).toFixed(1)} Mo`);

  console.log('\nTraitement audio (débruitage + normalisation)…');
  console.log('  Cela peut prendre plusieurs minutes pour une prédication d’~1 h.\n');

  const ffmpegArgs = [
    '-hide_banner',
    '-y',
    '-i',
    inputPath,
    '-vn',
    '-ac',
    '1',
    '-ar',
    '44100',
    '-af',
    AUDIO_FILTER,
    '-c:a',
    'libmp3lame',
    '-b:a',
    '96k',
    outMp3,
  ];

  const proc = spawnSync(ffmpegPath, ffmpegArgs, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (proc.status !== 0) {
    console.error(proc.stderr || proc.stdout);
    process.exit(1);
  }

  const after = probe(outMp3);
  const durationAfter = Math.round(parseFloat(after.format?.duration || 0));
  const sizeAfter = parseInt(after.format?.size || 0, 10);

  const meta = {
    slug,
    title: titleArg || `Prédication — ${slug.replace(/^predication-/, '').replace(/-/g, '/')}`,
    audio_url: `/audio/sermons/${slug}.mp3`,
    duration_seconds: durationAfter,
    language: 'fr',
    is_premium: false,
    processed_at: new Date().toISOString(),
    source: path.basename(inputPath),
    source_duration_seconds: durationBefore,
    source_size_bytes: sizeBefore,
    output_size_bytes: sizeAfter,
  };

  fs.writeFileSync(outMeta, JSON.stringify(meta, null, 2));

  console.log('✓ Terminé');
  console.log(`  MP3: ${outMp3}`);
  console.log(`  Durée: ${Math.floor(durationAfter / 60)} min ${durationAfter % 60} s`);
  console.log(`  Taille: ${(sizeAfter / 1024 / 1024).toFixed(1)} Mo (avant: ${(sizeBefore / 1024 / 1024).toFixed(1)} Mo)`);
  console.log(`  Métadonnées: ${outMeta}`);
  console.log('\nProchaine étape: ajouter l’épisode au catalogue (podcastsCatalog.js) ou lancer seed:podcasts.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
