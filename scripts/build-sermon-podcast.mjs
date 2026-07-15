/**
 * Pipeline prédication : audio nettoyé + transcription offline + métadonnées podcast.
 *
 * Usage:
 *   node scripts/build-sermon-podcast.mjs "chemin/source.mp4" --slug=predication-2026-07-13 --title="Prédication — 13 juillet 2026"
 *   node scripts/build-sermon-podcast.mjs --skip-audio --slug=predication-2026-07-13   # transcript seulement
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SERMONS_DIR = path.join(ROOT, 'public', 'audio', 'sermons');

function parseArgs(argv) {
  const positional = [];
  const opts = { model: 'small', lang: 'fr', skipAudio: false };
  for (const arg of argv) {
    if (arg.startsWith('--slug=')) opts.slug = arg.slice(7).trim();
    else if (arg.startsWith('--title=')) opts.title = arg.slice(8).trim();
    else if (arg.startsWith('--model=')) opts.model = arg.slice(8).trim();
    else if (arg.startsWith('--lang=')) opts.lang = arg.slice(7).trim();
    else if (arg === '--skip-audio') opts.skipAudio = true;
    else positional.push(arg);
  }
  return { input: positional[0], ...opts };
}

function runNode(script, args) {
  const res = spawnSync(process.execPath, [path.join(ROOT, script), ...args], {
    stdio: 'inherit',
    cwd: ROOT,
  });
  if (res.status !== 0) process.exit(res.status || 1);
}

function runPython(script, args) {
  const py = process.env.PYTHON || 'python';
  const res = spawnSync(py, [path.join(ROOT, script), ...args], {
    stdio: 'inherit',
    cwd: ROOT,
  });
  if (res.status !== 0) process.exit(res.status || 1);
}

function updateMeta(slug, patch) {
  const metaPath = path.join(SERMONS_DIR, `${slug}.json`);
  const base = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : { slug };
  fs.writeFileSync(metaPath, JSON.stringify({ ...base, ...patch }, null, 2));
}

async function main() {
  const { input, slug, title, model, lang, skipAudio } = parseArgs(process.argv.slice(2));

  if (!slug && !input) {
    console.error(
      'Usage: node scripts/build-sermon-podcast.mjs <source> --slug=... [--title=...] [--model=medium]'
    );
    process.exit(1);
  }

  fs.mkdirSync(SERMONS_DIR, { recursive: true });

  let resolvedSlug = slug;
  let mp3Path;

  if (!skipAudio) {
    if (!input) {
      console.error('Fichier source requis (ou --skip-audio)');
      process.exit(1);
    }
    const audioArgs = [path.resolve(input)];
    if (slug) audioArgs.push(`--slug=${slug}`);
    if (title) audioArgs.push(`--title=${title}`);
    runNode('scripts/process-sermon-audio.mjs', audioArgs);

    const metaFiles = fs.readdirSync(SERMONS_DIR).filter((f) => f.endsWith('.json') && !f.includes('.transcript.'));
    const latest = metaFiles
      .map((f) => ({ f, m: fs.statSync(path.join(SERMONS_DIR, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m)[0];
    resolvedSlug = slug || latest?.f.replace('.json', '');
    mp3Path = path.join(SERMONS_DIR, `${resolvedSlug}.mp3`);
  } else {
    if (!slug) {
      console.error('--slug requis avec --skip-audio');
      process.exit(1);
    }
    resolvedSlug = slug;
    mp3Path = path.join(SERMONS_DIR, `${resolvedSlug}.mp3`);
  }

  if (!fs.existsSync(mp3Path)) {
    console.error(`MP3 introuvable: ${mp3Path}`);
    process.exit(1);
  }

  const transcriptPath = path.join(SERMONS_DIR, `${resolvedSlug}.transcript.json`);
  runPython('scripts/transcribe-sermon-local.py', [
    mp3Path,
    `--model=${model}`,
    `--lang=${lang}`,
    `--out=${transcriptPath}`,
  ]);

  const transcript = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));
  updateMeta(resolvedSlug, {
    slug: resolvedSlug,
    title: title || transcript.summary?.slice(0, 80) || resolvedSlug,
    audio_url: `/audio/sermons/${resolvedSlug}.mp3`,
    transcript_url: `/audio/sermons/${resolvedSlug}.transcript.json`,
    duration_seconds: transcript.duration_seconds,
    language: lang,
    is_premium: false,
    content_type: 'sermon',
    summary: transcript.summary || '',
    transcript_paragraphs: transcript.paragraphs?.length || 0,
    updated_at: new Date().toISOString(),
  });

  console.log('\n✓ Podcast prêt');
  console.log(`  slug: ${resolvedSlug}`);
  console.log(`  audio: /audio/sermons/${resolvedSlug}.mp3`);
  console.log(`  transcript: /audio/sermons/${resolvedSlug}.transcript.json`);
  console.log('\nAjoutez l’épisode dans src/data/podcastsCatalog.js si ce n’est pas déjà fait.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
