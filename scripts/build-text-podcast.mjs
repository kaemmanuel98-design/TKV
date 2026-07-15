/**
 * Crée un épisode podcast à partir d'un texte (TTS professionnel + transcription).
 *
 * Usage:
 *   node scripts/build-text-podcast.mjs --file=mon-texte.txt --slug=foi-et-grace --title="La foi et la grâce"
 *   node scripts/build-text-podcast.mjs --file=sermon.txt --slug=... --title="..." --desc="..." --lang=fr
 *
 * Sortie:
 *   public/audio/podcasts/<slug>.mp3
 *   public/audio/podcasts/<slug>.transcript.json
 *   public/audio/podcasts/<slug>.json
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import { synthesizeSpeech } from '../server/lib/tts.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'audio', 'podcasts');

const LOCALE_MAP = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  nl: 'nl-NL',
  pt: 'pt-PT',
  ar: 'ar-SA',
};

const MAX_CHUNK = 3600;

function parseArgs(argv) {
  const opts = { lang: 'fr' };
  for (const arg of argv) {
    if (arg.startsWith('--file=')) opts.file = arg.slice(7).trim();
    else if (arg.startsWith('--slug=')) opts.slug = arg.slice(7).trim();
    else if (arg.startsWith('--title=')) opts.title = arg.slice(8).trim();
    else if (arg.startsWith('--desc=')) opts.desc = arg.slice(7).trim();
    else if (arg.startsWith('--lang=')) opts.lang = arg.slice(7).trim();
    else if (arg === '--no-music') opts.noMusic = true;
    else if (arg === '--music') opts.music = true;
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

function prepareText(raw) {
  return spokenBibleRefs(
    String(raw)
      .replace(/\r\n/g, '\n')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
    'fr'
  );
}

function spokenBibleRefs(text, lang = 'fr') {
  if (!text?.includes(':')) return text;
  const book =
    String.raw`(?:\d+\s+)?[A-ZÀ-ÜÉÈÊËÎÏÔÙÛÜÇ][\wàâäéèêëïîôùûüç'-]*(?:\s+[\wàâäéèêëïîôùûüç'-]+)?`;
  const re = new RegExp(
    `(${book})\\s+(\\d{1,3})\\s*:\\s*(\\d{1,3})(?:\\s*[-–]\\s*(\\d{1,3}))?`,
    'gu'
  );
  return text.replace(re, (_, b, ch, v, end) => {
    if (lang.split('-')[0] === 'en') {
      return end
        ? `${b} chapter ${ch}, verses ${v} to ${end}`
        : `${b} chapter ${ch}, verse ${v}`;
    }
    return end
      ? `${b} chapitre ${ch}, versets ${v} à ${end}`
      : `${b} chapitre ${ch}, verset ${v}`;
  });
}

function splitParagraphs(text) {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n+/g, ' ').trim())
    .filter((p) => p.length > 0);
}

function chunkForTts(paragraphs) {
  const chunks = [];
  let buf = '';

  for (const p of paragraphs) {
    if ((buf + '\n\n' + p).length > MAX_CHUNK && buf) {
      chunks.push(buf.trim());
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks;
}

function probeDuration(file) {
  const res = spawnSync(ffprobePath.path, [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=nk=1:nw=1',
    file,
  ], { encoding: 'utf8' });
  return parseFloat(String(res.stdout).trim()) || 0;
}

function concatMp3(files, outPath) {
  const listPath = path.join(os.tmpdir(), `tkv-concat-${Date.now()}.txt`);
  const listContent = files.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n');
  fs.writeFileSync(listPath, listContent);
  const res = spawnSync(
    ffmpegPath,
    ['-hide_banner', '-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outPath],
    { encoding: 'utf8' }
  );
  fs.unlinkSync(listPath);
  if (res.status !== 0) throw new Error(res.stderr || 'ffmpeg concat failed');
}

function synthesizeEdgeTtsFile(inputPath, lang, outPath) {
  const py = process.env.PYTHON || 'python';
  const res = spawnSync(
    py,
    [path.join(ROOT, 'scripts/edge-tts-batch.py'), inputPath, outPath, lang?.split('-')[0] || 'fr'],
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
  if (res.status !== 0) {
    throw new Error(res.stderr || res.stdout || 'edge-tts failed');
  }
}

async function synthesizeChunk(text, locale, lang, outPath) {
  try {
    const audio = await synthesizeSpeech(text, locale);
    fs.writeFileSync(outPath, audio);
    return 'openai';
  } catch {
    const tmpText = path.join(os.tmpdir(), `tkv-tts-${Date.now()}.txt`);
    fs.writeFileSync(tmpText, text, 'utf8');
    try {
      synthesizeEdgeTtsFile(tmpText, lang, outPath);
      return 'edge-tts';
    } finally {
      fs.unlinkSync(tmpText);
    }
  }
}

function buildChapters(paragraphs, intervalSec = 300) {
  const chapters = [];
  let next = 0;
  for (const p of paragraphs) {
    if (p.start >= next) {
      chapters.push({
        start: p.start,
        title: p.text.slice(0, 72) + (p.text.length > 72 ? '…' : ''),
      });
      next += intervalSec;
    }
  }
  return chapters.length ? chapters : [{ start: 0, title: 'Introduction' }];
}

async function main() {
  const { file, slug: slugArg, title, desc, lang, noMusic, music } = parseArgs(process.argv.slice(2));
  const withMusic = !noMusic;

  if (!file || !title) {
    console.error(
      'Usage: node scripts/build-text-podcast.mjs --file=texte.txt --slug=mon-episode --title="Titre" [--desc="Description"] [--lang=fr]'
    );
    process.exit(1);
  }

  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) {
    console.error(`Fichier introuvable: ${filePath}`);
    process.exit(1);
  }

  const slug = slugArg || slugify(title);
  const locale = LOCALE_MAP[lang?.split('-')[0]] || LOCALE_MAP.fr;
  const raw = fs.readFileSync(filePath, 'utf8');
  const text = prepareText(raw);
  const paragraphsRaw = splitParagraphs(text);

  if (!paragraphsRaw.length) {
    console.error('Texte vide après préparation.');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tkv-tts-'));
  const ttsChunks = chunkForTts(paragraphsRaw);

  console.log(`Épisode: ${title}`);
  console.log(`Slug: ${slug}`);
  console.log(`Paragraphes: ${paragraphsRaw.length} · blocs TTS: ${ttsChunks.length}`);
  console.log(`Voix (${locale})…\n`);

  const partFiles = [];
  let ttsEngine = 'openai';
  try {
    for (let i = 0; i < ttsChunks.length; i += 1) {
      process.stdout.write(`Synthèse ${i + 1}/${ttsChunks.length}… `);
      const partPath = path.join(tmpDir, `part-${String(i).padStart(3, '0')}.mp3`);
      const engine = await synthesizeChunk(ttsChunks[i], locale, lang, partPath);
      if (i === 0) ttsEngine = engine;
      partFiles.push(partPath);
      console.log(`${engine} ok`);
    }

    const outMp3 = path.join(OUT_DIR, `${slug}.mp3`);
    if (partFiles.length === 1) {
      fs.copyFileSync(partFiles[0], outMp3);
    } else {
      concatMp3(partFiles, outMp3);
    }

    if (withMusic) {
      console.log('\nPiano de fond…');
      const mixRes = spawnSync(
        process.execPath,
        [path.join(ROOT, 'scripts/mix-podcast-music.mjs'), outMp3],
        { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
      );
      if (mixRes.status !== 0) {
        console.warn('Mix piano ignoré:', mixRes.stderr || mixRes.stdout);
      }
    }

    const duration = probeDuration(outMp3);
    const totalChars = paragraphsRaw.reduce((n, p) => n + p.length, 0);
    let cursor = 0;
    const paragraphs = paragraphsRaw.map((p) => {
      const share = totalChars > 0 ? p.length / totalChars : 1 / paragraphsRaw.length;
      const segDur = duration * share;
      const start = cursor;
      cursor += segDur;
      return {
        start: Math.round(start * 100) / 100,
        end: Math.round(cursor * 100) / 100,
        text: p,
      };
    });

    const segments = paragraphs.map((p, id) => ({
      id,
      start: p.start,
      end: p.end,
      text: p.text,
    }));

    const transcript = {
      slug,
      language: lang?.split('-')[0] || 'fr',
      duration_seconds: Math.round(duration),
      source: 'text',
      tts_engine: ttsEngine,
      created_at: new Date().toISOString(),
      summary: paragraphsRaw[0].slice(0, 280) + (paragraphsRaw[0].length > 280 ? '…' : ''),
      chapters: buildChapters(paragraphs),
      segments,
      paragraphs,
    };

    const transcriptPath = path.join(OUT_DIR, `${slug}.transcript.json`);
    fs.writeFileSync(transcriptPath, JSON.stringify(transcript, null, 2));
    fs.writeFileSync(
      transcriptPath.replace('.json', '.txt'),
      paragraphsRaw.join('\n\n'),
      'utf8'
    );

    const meta = {
      slug,
      title,
      description: desc || transcript.summary,
      audio_url: `/audio/podcasts/${slug}.mp3`,
      transcript_url: `/audio/podcasts/${slug}.transcript.json`,
      duration_seconds: Math.round(duration),
      language: lang?.split('-')[0] || 'fr',
      is_premium: false,
      content_type: 'podcast',
      source_file: path.basename(filePath),
      created_at: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.json`), JSON.stringify(meta, null, 2));

    console.log(`\n✓ MP3 (${Math.round(duration)}s): ${outMp3}`);
    console.log(`✓ Transcript: ${transcriptPath}`);
    console.log('\nAjoutez l’épisode dans src/data/podcastsCatalog.js + clés i18n si besoin.');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
