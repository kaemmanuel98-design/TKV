/**
 * Génère les MP3 + transcripts pour chaque langue à partir du transcript FR.
 * Par défaut : ElevenLabs (même voix clonée, plus naturel qu'Edge TTS).
 *
 * Usage:
 *   node scripts/build-multilang-podcast-audio.mjs --slug=revenons-premier-amour
 *   node scripts/build-multilang-podcast-audio.mjs --all
 *   node scripts/build-multilang-podcast-audio.mjs --all --langs=en,es
 *   node scripts/build-multilang-podcast-audio.mjs --all --engine=edge
 *   node scripts/build-multilang-podcast-audio.mjs --slug=... --force
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { elevenlabsConfigured } from '../server/lib/elevenlabsTts.js';
import { synthesizeFromText } from './lib/synthesizeElevenLabsPodcast.mjs';
import { probeDuration, paragraphsWithTiming, buildChapters } from './lib/podcastAudio.mjs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'audio', 'podcasts');
const TARGETS_DEFAULT = ['en', 'es', 'nl', 'pt', 'ar'];

const CATALOG_SLUGS = [
  'revenons-premier-amour',
  'puissance-grace-faiblesses',
  'tunique-couleurs-destinee',
  'resurrection-probleme-vue',
];

function parseArgs(argv) {
  const opts = {
    langs: [...TARGETS_DEFAULT],
    all: false,
    skipTranslate: false,
    skipMusic: true,
    force: false,
    engine: elevenlabsConfigured() ? 'elevenlabs' : 'edge',
  };
  for (const arg of argv) {
    if (arg.startsWith('--slug=')) opts.slug = arg.slice(7).trim();
    else if (arg.startsWith('--langs=')) opts.langs = arg.slice(8).split(',').map((s) => s.trim());
    else if (arg.startsWith('--engine=')) opts.engine = arg.slice(9).trim();
    else if (arg === '--all') opts.all = true;
    else if (arg === '--skip-translate') opts.skipTranslate = true;
    else if (arg === '--no-music') opts.skipMusic = true;
    else if (arg === '--music') opts.skipMusic = false;
    else if (arg === '--force') opts.force = true;
  }
  return opts;
}

function ensureTranslations(transcriptPath) {
  const data = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));
  const missing = TARGETS_DEFAULT.filter((l) => !data.translations?.[l]?.paragraphs?.length);
  if (!missing.length) return data;

  console.log(`  Traductions manquantes (${missing.join(', ')})…`);
  const tr = spawnSync(
    process.execPath,
    [path.join(ROOT, 'scripts/translate-podcast-transcript.mjs'), transcriptPath],
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
  if (tr.status !== 0) {
    console.warn(tr.stderr || tr.stdout);
  }
  return JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));
}

function synthesizeEdgeTts(textFile, lang, outPath) {
  const py = process.env.PYTHON || 'python';
  const res = spawnSync(
    py,
    [path.join(ROOT, 'scripts/edge-tts-batch.py'), textFile, outPath, lang],
    { encoding: 'utf8', maxBuffer: 80 * 1024 * 1024 }
  );
  if (res.status !== 0) throw new Error(res.stderr || res.stdout || 'edge-tts failed');
}

function mixMusic(voiceMp3, finalMp3) {
  const res = spawnSync(
    process.execPath,
    [path.join(ROOT, 'scripts/mix-podcast-music.mjs'), voiceMp3, `--out=${finalMp3}`],
    { encoding: 'utf8', maxBuffer: 80 * 1024 * 1024 }
  );
  if (res.status !== 0) {
    fs.copyFileSync(voiceMp3, finalMp3);
  }
}

async function buildLangElevenLabs(slug, lang, frData, opts) {
  const sfx = lang === 'fr' ? '' : `.${lang}`;
  const finalMp3 = path.join(OUT_DIR, `${slug}${sfx}.mp3`);
  if (fs.existsSync(finalMp3) && !opts.force) {
    console.log(`  ⊘ ${lang} déjà présent ( --force pour régénérer )`);
    return;
  }

  const pack =
    lang === 'fr'
      ? { paragraphs: frData.paragraphs, summary: frData.summary, chapters: frData.chapters }
      : frData.translations?.[lang];

  if (!pack?.paragraphs?.length) {
    console.warn(`  ✗ ${lang} : pas de texte traduit`);
    return;
  }

  const rawText = pack.paragraphs.map((p) => p.text).join('\n\n');
  const tmpVoice = path.join(os.tmpdir(), `tkv-${slug}-${lang}-${Date.now()}.mp3`);

  console.log(`  ▶ ElevenLabs ${lang}…`);
  const result = await synthesizeFromText({
    rawText,
    lang,
    outPath: tmpVoice,
    polish: true,
    onProgress: ({ index, total }) => {
      process.stdout.write(`    prise ${index}/${total}\n`);
    },
  });

  if (opts.skipMusic) {
    fs.copyFileSync(tmpVoice, finalMp3);
  } else {
    mixMusic(tmpVoice, finalMp3);
  }
  try {
    fs.unlinkSync(tmpVoice);
  } catch {
    /* ignore */
  }

  const duration = probeDuration(finalMp3);
  const summary =
    pack.summary ||
    (result.summary) ||
    frData.summary;

  const transcript = {
    slug,
    language: lang,
    duration_seconds: Math.round(duration),
    source: lang === 'fr' ? frData.source || 'predication' : 'translation',
    tts_engine: 'elevenlabs',
    voice_id: process.env.ELEVENLABS_VOICE_ID,
    created_at: new Date().toISOString(),
    summary,
    chapters: pack.chapters?.length ? pack.chapters : result.chapters,
    segments: result.paragraphs.map((p, id) => ({ id, ...p })),
    paragraphs: result.paragraphs,
  };

  fs.writeFileSync(
    path.join(OUT_DIR, `${slug}${sfx}.transcript.json`),
    JSON.stringify(transcript, null, 2)
  );
  console.log(`  ✓ ${lang} · ${Math.round(duration)}s → ${path.basename(finalMp3)}`);
}

async function buildLangEdge(slug, lang, frData, opts) {
  const sfx = lang === 'fr' ? '' : `.${lang}`;
  const finalMp3 = path.join(OUT_DIR, `${slug}${sfx}.mp3`);
  if (fs.existsSync(finalMp3) && !opts.force) {
    console.log(`  ⊘ ${lang} déjà présent`);
    return;
  }

  const pack = frData.translations?.[lang];
  if (!pack?.paragraphs?.length) {
    console.warn(`  ✗ ${lang} : pas de texte traduit`);
    return;
  }

  const texts = pack.paragraphs.map((p) => p.text);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `tkv-pod-${lang}-`));
  const textFile = path.join(tmpDir, 'script.txt');
  const voiceMp3 = path.join(tmpDir, 'voice.mp3');

  fs.writeFileSync(textFile, texts.join('\n\n'), 'utf8');
  console.log(`  ▶ Edge TTS ${lang} (${texts.length} paragraphes)…`);
  synthesizeEdgeTts(textFile, lang, voiceMp3);

  if (opts.skipMusic) {
    fs.copyFileSync(voiceMp3, finalMp3);
  } else {
    mixMusic(voiceMp3, finalMp3);
  }

  const duration = probeDuration(finalMp3);
  const paragraphs = paragraphsWithTiming(texts, duration);
  const summary =
    pack.summary ||
    (texts[0]?.slice(0, 280) + (texts[0]?.length > 280 ? '…' : '')) ||
    frData.summary;

  const transcript = {
    slug,
    language: lang,
    duration_seconds: Math.round(duration),
    source: 'text',
    tts_engine: 'edge-tts',
    created_at: new Date().toISOString(),
    summary,
    chapters: pack.chapters?.length ? pack.chapters : buildChapters(paragraphs),
    segments: paragraphs.map((p, id) => ({ id, ...p })),
    paragraphs,
  };

  fs.writeFileSync(
    path.join(OUT_DIR, `${slug}${sfx}.transcript.json`),
    JSON.stringify(transcript, null, 2)
  );
  console.log(`  ✓ ${lang} · ${Math.round(duration)}s → ${path.basename(finalMp3)}`);

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

async function processSlug(slug, langs, opts) {
  const frTranscriptPath = path.join(OUT_DIR, `${slug}.transcript.json`);
  if (!fs.existsSync(frTranscriptPath)) {
    console.warn(`✗ ${slug} : transcript FR absent`);
    return;
  }

  console.log(`\n▸ ${slug} · moteur ${opts.engine}`);
  let frData = JSON.parse(fs.readFileSync(frTranscriptPath, 'utf8'));
  if (!opts.skipTranslate) {
    frData = ensureTranslations(frTranscriptPath);
  }

  for (const lang of langs) {
    if (opts.engine === 'elevenlabs') {
      if (!elevenlabsConfigured()) {
        console.warn('  ElevenLabs non configuré — fallback Edge TTS');
        await buildLangEdge(slug, lang, frData, opts);
      } else {
        await buildLangElevenLabs(slug, lang, frData, opts);
      }
    } else {
      await buildLangEdge(slug, lang, frData, opts);
    }
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const slugs = opts.all ? CATALOG_SLUGS : opts.slug ? [opts.slug] : [];

  if (!slugs.length) {
    console.error(
      'Usage: node scripts/build-multilang-podcast-audio.mjs --slug=... | --all [--langs=en,es] [--force]'
    );
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const slug of slugs) {
    await processSlug(slug, opts.langs, opts);
  }

  spawnSync(process.execPath, [path.join(ROOT, 'scripts/update-podcast-manifest.mjs')], {
    stdio: 'inherit',
  });
  console.log('\nTerminé. Redéployez sur Vercel pour publier les nouveaux MP3.');
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
