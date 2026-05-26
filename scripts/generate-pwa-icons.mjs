/**
 * Génère des PNG PWA optimisés depuis public/favicon.svg
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const svgPath = join(publicDir, 'favicon.svg');
const svg = readFileSync(svgPath);

const pngOptions = {
  compressionLevel: 9,
  quality: 82,
  effort: 10,
  palette: true,
  colors: 64,
};

const sizes = [
  { file: 'favicon-32.png', size: 32 },
  { file: 'favicon-48.png', size: 48 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
];

async function renderMaskable(size) {
  const inner = Math.round(size * 0.72);
  const icon = await sharp(svg).resize(inner, inner, { fit: 'contain', background: '#070708' }).png().toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 7, g: 7, b: 8, alpha: 1 },
    },
  })
    .composite([{ input: icon, gravity: 'center' }])
    .png(pngOptions)
    .toBuffer();
}

console.log('Generating PWA icons from favicon.svg…');

for (const { file, size } of sizes) {
  const out = join(publicDir, file);
  await sharp(svg).resize(size, size, { fit: 'contain', background: '#070708' }).png(pngOptions).toFile(out);
  const { size: bytes } = await import('fs').then((fs) => ({ size: fs.statSync(out).size }));
  console.log(`  ✓ ${file} (${size}px) — ${(bytes / 1024).toFixed(1)} KB`);
}

const maskablePath = join(publicDir, 'pwa-512x512-maskable.png');
await sharp(await renderMaskable(512)).toFile(maskablePath);
const maskableKb = (await import('fs')).statSync(maskablePath).size / 1024;
console.log(`  ✓ pwa-512x512-maskable.png (512px) — ${maskableKb.toFixed(1)} KB`);

console.log('Done.');
