/**
 * Télécharge les photos Héritage → public/heritage/photos/
 * 1) Wikimedia Commons (fichiers vérifiés)
 * 2) Miniatures Wikipedia pour le reste
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HERITAGE_COMMONS_FILES } from '../src/data/heritage/heritageCommonsFiles.js';
import { HERITAGE_WIKIPEDIA_ARTICLES } from '../src/data/heritage/heritageWikipediaArticles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../public/heritage/photos');
const MANIFEST_PATH = path.join(OUT_DIR, 'manifest.json');
const MANIFEST_SRC_PATH = path.join(
  __dirname,
  '../src/data/heritage/heritagePhotosManifest.json',
);
const UA = 'TKV-App/1.0 (heritage photo sync; https://tkv-app.vercel.app)';
const WIDTH = 960;
const DELAY_MS = 2000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extFromUrl(url) {
  if (url.includes('.png')) return 'png';
  if (url.includes('.svg')) return 'png';
  return 'jpg';
}

async function commonsThumbUrl(fileName) {
  const params = new URLSearchParams({
    action: 'query',
    titles: `File:${fileName}`,
    prop: 'imageinfo',
    iiprop: 'url|thumburl',
    iiurlwidth: String(WIDTH),
    format: 'json',
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { 'User-Agent': UA },
  });
  const text = await res.text();
  if (!res.ok || text.startsWith('You are')) return null;
  const data = JSON.parse(text);
  const page = Object.values(data.query?.pages || {})[0];
  if (!page || page.missing !== undefined) return null;
  const info = page.imageinfo?.[0];
  return info?.thumburl || info?.url || null;
}

async function wikipediaThumbUrl(articleTitle) {
  const params = new URLSearchParams({
    action: 'query',
    titles: articleTitle,
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: String(WIDTH),
    format: 'json',
    origin: '*',
  });
  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    headers: { 'User-Agent': UA },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const page = Object.values(data.query?.pages || {})[0];
  return page?.thumbnail?.source || null;
}

async function downloadUrl(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 400) return false;
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function saveSlug(slug, url, source) {
  const ext = extFromUrl(url);
  const dest = path.join(OUT_DIR, `${slug}.${ext}`);
  const size = await downloadUrl(url, dest);
  if (!size) {
    console.warn(`  ✗ ${slug}: échec téléchargement (${source})`);
    return null;
  }
  console.log(`  ✓ ${slug}.${ext} — ${(size / 1024).toFixed(1)} KB (${source})`);
  return { slug, ext };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let manifest = {};
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    } catch {
      manifest = {};
    }
  }
  const results = [];

  const allSlugs = new Set([
    ...Object.keys(HERITAGE_COMMONS_FILES),
    ...Object.keys(HERITAGE_WIKIPEDIA_ARTICLES),
  ]);

  console.log('TKV — téléchargement photos Héritage\n');

  for (const slug of allSlugs) {
    const cached = manifest[slug];
    const candidates = cached
      ? [path.join(__dirname, '../public', cached.replace(/^\//, ''))]
      : ['jpg', 'png', 'webp'].map((ext) => path.join(OUT_DIR, `${slug}.${ext}`));
    const existingPath = candidates.find(
      (p) => fs.existsSync(p) && fs.statSync(p).size > 400,
    );
    if (existingPath) {
      const ext = path.extname(existingPath).slice(1);
      console.log(`  · ${slug} (déjà présent)`);
      results.push({ slug, ext });
      continue;
    }

    let url = null;
    let source = '';

    const commonsFile = HERITAGE_COMMONS_FILES[slug];
    if (commonsFile) {
      url = await commonsThumbUrl(commonsFile);
      if (url) source = 'Commons';
      await sleep(DELAY_MS);
    }

    if (!url && HERITAGE_WIKIPEDIA_ARTICLES[slug]) {
      url = await wikipediaThumbUrl(HERITAGE_WIKIPEDIA_ARTICLES[slug]);
      if (url) source = 'Wikipedia';
      await sleep(800);
    }

    if (!url) {
      console.warn(`  ✗ ${slug}: aucune source`);
      continue;
    }

    const r = await saveSlug(slug, url, source);
    if (r) results.push(r);
    await sleep(400);
  }

  for (const { slug, ext } of results) {
    manifest[slug] = `/heritage/photos/${slug}.${ext}`;
  }
  const manifestJson = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(MANIFEST_PATH, manifestJson);
  fs.writeFileSync(MANIFEST_SRC_PATH, manifestJson);
  console.log(`\nTerminé : ${results.length}/${allSlugs.size} photos`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
