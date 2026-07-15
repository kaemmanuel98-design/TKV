/**
 * Mixe la voix d'un podcast avec un piano de fond (ducking + normalisation).
 *
 * Usage:
 *   node scripts/mix-podcast-music.mjs public/audio/podcasts/revenons-premier-amour.mp3
 *   node scripts/mix-podcast-music.mjs voice.mp3 --bed=public/audio/beds/piano-worship-loop.mp3 --level=0.11
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DEFAULT_BED = path.join(ROOT, 'public', 'audio', 'beds', 'piano-worship-loop.mp3');

function parseArgs(argv) {
  const opts = { level: 0.11, duck: 0.35 };
  const positional = [];
  for (const arg of argv) {
    if (arg.startsWith('--bed=')) opts.bed = arg.slice(6).trim();
    else if (arg.startsWith('--level=')) opts.level = parseFloat(arg.slice(8));
    else if (arg.startsWith('--duck=')) opts.duck = parseFloat(arg.slice(7));
    else if (arg.startsWith('--out=')) opts.out = arg.slice(6).trim();
    else positional.push(arg);
  }
  opts.input = positional[0];
  opts.bed = opts.bed || DEFAULT_BED;
  return opts;
}

function probeDuration(file) {
  const res = spawnSync(
    ffprobePath.path,
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', file],
    { encoding: 'utf8' }
  );
  return parseFloat(String(res.stdout).trim()) || 0;
}

function ensurePianoBed(bedPath) {
  if (fs.existsSync(bedPath)) return;
  console.log('Génération du piano de fond…');
  const py = process.env.PYTHON || 'python';
  const res = spawnSync(py, [path.join(ROOT, 'scripts/generate-piano-bed.py'), '240', bedPath], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (res.status !== 0) {
    throw new Error(res.stderr || res.stdout || 'generate-piano-bed failed');
  }
}

function mixVoiceWithBed({ input, bed, out, level, duck }) {
  const duration = probeDuration(input);
  const fadeOutStart = Math.max(0, duration - 10);

  const filter = [
    `[0:a]highpass=f=80,volume=1.05,asplit=2[voice][voice_sc]`,
    `[1:a]aloop=loop=-1:size=2e+09,volume=${level},afade=t=in:st=0:d=4,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=10,lowpass=f=3800,highpass=f=120[piano]`,
    `[piano][voice_sc]sidechaincompress=threshold=0.02:ratio=6:attack=120:release=800:makeup=1[ducked]`,
    `[voice][ducked]amix=inputs=2:duration=first:dropout_transition=3,loudnorm=I=-16:TP=-1.5:LRA=11[out]`,
  ].join(';');

  const res = spawnSync(
    ffmpegPath,
    [
      '-hide_banner',
      '-y',
      '-i',
      input,
      '-stream_loop',
      '-1',
      '-i',
      bed,
      '-filter_complex',
      filter,
      '-map',
      '[out]',
      '-t',
      String(duration),
      '-c:a',
      'libmp3lame',
      '-b:a',
      '128k',
      '-ar',
      '44100',
      out,
    ],
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );

  if (res.status !== 0) {
    throw new Error(res.stderr || res.stdout || 'ffmpeg mix failed');
  }
}

function main() {
  const { input, bed, level, duck, out: outArg } = parseArgs(process.argv.slice(2));
  if (!input) {
    console.error('Usage: node scripts/mix-podcast-music.mjs <voice.mp3> [--bed=...] [--level=0.11]');
    process.exit(1);
  }

  const voicePath = path.resolve(input);
  if (!fs.existsSync(voicePath)) {
    console.error(`Fichier introuvable: ${voicePath}`);
    process.exit(1);
  }

  const bedPath = path.resolve(bed);
  ensurePianoBed(bedPath);

  const backupPath = voicePath.replace(/\.mp3$/i, '.voice-only.mp3');
  if (!fs.existsSync(backupPath) && !/\.voice-only\.mp3$/i.test(voicePath)) {
    fs.copyFileSync(voicePath, backupPath);
    console.log(`Sauvegarde voix seule: ${backupPath}`);
  }

  const tmpOut = outArg ? path.resolve(outArg) : `${voicePath}.mixed.mp3`;
  const duration = probeDuration(voicePath);
  console.log(`Mix ${path.basename(voicePath)} (${Math.round(duration)}s) + piano (${level * 100}% vol.)…`);

  mixVoiceWithBed({ input: voicePath, bed: bedPath, out: tmpOut, level, duck });

  if (!outArg) {
    const finalPath = voicePath;
    fs.copyFileSync(tmpOut, finalPath);
    try {
      fs.unlinkSync(tmpOut);
    } catch {
      /* fichier temporaire laissé si verrouillé */
    }
    console.log(`✓ ${finalPath}`);
  } else {
    console.log(`✓ ${tmpOut}`);
  }
}

main();
