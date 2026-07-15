/**
 * Transcription longue (prédication ~1h) via Whisper, en découpant en petits segments
 * pour éviter les erreurs réseau (ECONNRESET) sur les gros fichiers.
 *
 * Usage:
 *   node scripts/transcribe-sermon.mjs "public/audio/sermons/predication-2026-07-13.mp3" --lang=fr --out=public/audio/sermons/predication-2026-07-13.transcript.fr.json
 *
 * Sortie:
 *  - JSON : { language, paragraphs: string[], segments: [{ start, end, text }] }
 *  - TXT  : même nom en .txt (concat paragraphes)
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import { config } from '../server/config.js';

function parseArgs(argv) {
  const positional = [];
  const opts = {};
  for (const arg of argv) {
    if (arg.startsWith('--lang=')) opts.lang = arg.slice(7).trim();
    else if (arg.startsWith('--out=')) opts.out = arg.slice(6).trim();
    else if (arg.startsWith('--chunk=')) opts.chunk = Number(arg.slice(8));
    else positional.push(arg);
  }
  return { input: positional[0], ...opts };
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  if (res.status !== 0) {
    throw new Error(res.stderr || res.stdout || `Command failed: ${cmd}`);
  }
  return res.stdout;
}

function probeDurationSeconds(file) {
  const raw = run(ffprobePath.path, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', file]);
  const d = parseFloat(String(raw).trim());
  return Number.isFinite(d) ? d : 0;
}

function ensureDir(p) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
}

function splitToChunks(inputFile, tmpDir, chunkSeconds) {
  if (!ffmpegPath) throw new Error('ffmpeg-static indisponible');
  const outPattern = path.join(tmpDir, 'chunk-%03d.mp3');
  // -f segment : découpages réguliers, sans réencodage lourd (mp3 est ok ici, petits fichiers)
  run(ffmpegPath, [
    '-hide_banner',
    '-y',
    '-i',
    inputFile,
    '-vn',
    '-ac',
    '1',
    '-ar',
    '44100',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '64k',
    '-f',
    'segment',
    '-segment_time',
    String(chunkSeconds),
    '-reset_timestamps',
    '1',
    outPattern,
  ]);

  const files = fs
    .readdirSync(tmpDir)
    .filter((f) => /^chunk-\d{3}\.mp3$/.test(f))
    .sort()
    .map((f) => path.join(tmpDir, f));
  return files;
}

function splitIntoParagraphs(text) {
  const cleaned = String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!cleaned) return [];
  // Paragraphes "respirables" : on coupe sur doubles retours ou longs silences (déjà souvent présents)
  return cleaned.split(/\n{2,}/g).map((p) => p.replace(/\n+/g, ' ').trim()).filter(Boolean);
}

async function transcribeFile(openai, filePath, lang) {
  const buffer = fs.readFileSync(filePath);
  const file = await toFile(buffer, path.basename(filePath), { type: 'audio/mpeg' });
  const res = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: lang,
    response_format: 'text',
  });
  return (typeof res === 'string' ? res : res?.text || '').trim();
}

async function main() {
  const { input, lang = 'fr', out, chunk = 600 } = parseArgs(process.argv.slice(2));
  if (!input) {
    console.error('Usage: node scripts/transcribe-sermon.mjs <input.mp3> --lang=fr --out=...json [--chunk=600]');
    process.exit(1);
  }
  if (!config.openaiKey) {
    console.error('OPENAI_API_KEY manquante (config.openaiKey).');
    process.exit(1);
  }
  if (!ffprobePath?.path) {
    console.error('ffprobe-static indisponible');
    process.exit(1);
  }

  const inputPath = path.resolve(input);
  if (!fs.existsSync(inputPath)) {
    console.error(`Fichier introuvable: ${inputPath}`);
    process.exit(1);
  }

  const outPath =
    out?.trim() ||
    inputPath.replace(/\.mp3$/i, '') + `.transcript.${lang}.json`;

  ensureDir(outPath);

  const duration = probeDurationSeconds(inputPath);
  console.log(`Durée: ${Math.round(duration)} s (~${Math.round(duration / 60)} min)`);
  console.log(`Découpage: ${chunk}s par segment`);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tkv-transcribe-'));
  console.log(`Tmp: ${tmpDir}`);

  try {
    const chunks = splitToChunks(inputPath, tmpDir, chunk);
    console.log(`Segments: ${chunks.length}`);

    const openai = new OpenAI({ apiKey: config.openaiKey });
    const segments = [];
    let fullText = '';

    for (let i = 0; i < chunks.length; i += 1) {
      const start = i * chunk;
      const end = Math.min(duration || (i + 1) * chunk, (i + 1) * chunk);
      const name = path.basename(chunks[i]);
      process.stdout.write(`Transcription ${i + 1}/${chunks.length} (${name})… `);

      let text = '';
      let attempts = 0;
      while (!text && attempts < 3) {
        attempts += 1;
        try {
          text = await transcribeFile(openai, chunks[i], lang);
        } catch (e) {
          const msg = e?.message || String(e);
          process.stdout.write(`(retry ${attempts}/3: ${msg}) `);
        }
      }

      if (!text) {
        console.log('ECHEC');
        throw new Error(`Transcription échouée sur ${name}`);
      }

      console.log('ok');
      segments.push({ start, end, text });
      fullText += (fullText ? '\n\n' : '') + text;
    }

    const paragraphs = splitIntoParagraphs(fullText);
    const payload = {
      language: lang,
      duration_seconds: Math.round(duration),
      created_at: new Date().toISOString(),
      paragraphs,
      segments,
    };

    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
    const txtPath = outPath.replace(/\.json$/i, '.txt');
    fs.writeFileSync(txtPath, paragraphs.join('\n\n'));

    console.log(`✓ Transcript JSON: ${outPath}`);
    console.log(`✓ Transcript TXT : ${txtPath}`);
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

