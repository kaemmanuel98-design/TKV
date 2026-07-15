/** Finalise transcript + meta quand l'audio existe déjà */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import ffprobe from 'ffprobe-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const slug = process.argv[2] || 'revenons-premier-amour';
const title = process.argv[3] || 'Revenons à notre premier amour';
const desc =
  process.argv[4] ||
  "Méditation sur Apocalypse 2:1-7 — revenir à l'amour du Seigneur avant les œuvres.";
const textFile = process.argv[5] || path.join(ROOT, 'scripts/content/revenons-premier-amour.txt');

const outDir = path.join(ROOT, 'public/audio/podcasts');
const mp3Main = path.join(outDir, `${slug}.mp3`);
const mp3Voice = path.join(outDir, `${slug}.voice-only.mp3`);
const mp3 = fs.existsSync(mp3Main) ? mp3Main : mp3Voice;
const raw = fs.readFileSync(textFile, 'utf8');
const paras = raw
  .split(/\n{2,}/)
  .map((p) => p.replace(/\n+/g, ' ').trim())
  .filter(Boolean);

const durRes = spawnSync(
  ffprobe.path,
  ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', mp3],
  { encoding: 'utf8' }
);
const duration = parseFloat(String(durRes.stdout).trim()) || 0;
const total = paras.reduce((n, p) => n + p.length, 0);
let cursor = 0;
const paragraphs = paras.map((p) => {
  const start = cursor;
  cursor += duration * (p.length / total);
  return { start: Math.round(start * 100) / 100, end: Math.round(cursor * 100) / 100, text: p };
});

const chapters = [];
let next = 0;
for (const p of paragraphs) {
  if (p.start >= next) {
    chapters.push({ start: p.start, title: p.text.slice(0, 72) + (p.text.length > 72 ? '…' : '') });
    next += 300;
  }
}

const transcript = {
  slug,
  language: 'fr',
  duration_seconds: Math.round(duration),
  source: 'text',
  tts_engine: 'edge-tts',
  created_at: new Date().toISOString(),
  summary: paras[0].slice(0, 280) + (paras[0].length > 280 ? '…' : ''),
  chapters: chapters.length ? chapters : [{ start: 0, title: 'Introduction' }],
  segments: paragraphs.map((p, id) => ({ id, ...p })),
  paragraphs,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${slug}.transcript.json`), JSON.stringify(transcript, null, 2));
fs.writeFileSync(path.join(outDir, `${slug}.transcript.txt`), paras.join('\n\n'), 'utf8');
fs.writeFileSync(
  path.join(outDir, `${slug}.json`),
  JSON.stringify(
    {
      slug,
      title,
      description: desc,
      audio_url: `/audio/podcasts/${slug}.mp3`,
      transcript_url: `/audio/podcasts/${slug}.transcript.json`,
      duration_seconds: Math.round(duration),
      language: 'fr',
      is_premium: false,
      content_type: 'podcast',
      created_at: new Date().toISOString(),
    },
    null,
    2
  )
);

console.log(`✓ ${slug} · ${Math.round(duration)}s · ${paragraphs.length} paragraphes`);

if (process.env.SKIP_PODCAST_TRANSLATE !== '1') {
  console.log('Traductions transcript…');
  const tr = spawnSync(
    process.execPath,
    [path.join(ROOT, 'scripts/translate-podcast-transcript.mjs'), path.join(outDir, `${slug}.transcript.json`)],
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
  if (tr.status !== 0) {
    console.warn('Traductions partielles ou reportées:', tr.stderr || tr.stdout);
  }
}
