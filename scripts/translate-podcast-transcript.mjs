/**
 * Pré-traduit une transcription podcast (FR → en, es, nl, pt, ar).
 * Usage: node scripts/translate-podcast-transcript.mjs public/audio/podcasts/revenons-premier-amour.transcript.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { translateTexts } from '../server/lib/translateService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGETS = ['en', 'es', 'nl', 'pt', 'ar'];
const BATCH = 8;
const DELIM = '\n\n§§§TKV§§§\n\n';

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function translateList(texts, from, to) {
  const out = [];
  for (const batch of chunk(texts, BATCH)) {
    const joined = batch.join(DELIM);
    let translated = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        [translated] = await translateTexts([joined], { from, to });
        break;
      } catch (e) {
        const rateLimited = /too many requests/i.test(e.message || '');
        if (!rateLimited || attempt === 5) throw e;
        await new Promise((r) => setTimeout(r, 15000 * (attempt + 1)));
      }
    }
    const parts = String(translated || joined).split(DELIM);
    if (parts.length === batch.length) {
      out.push(...parts);
    } else {
      for (const line of batch) {
        let one = line;
        for (let attempt = 0; attempt < 4; attempt++) {
          try {
            [one] = await translateTexts([line], { from, to });
            break;
          } catch (e) {
            if (attempt === 3) throw e;
            await new Promise((r) => setTimeout(r, 12000 * (attempt + 1)));
          }
        }
        out.push(one);
      }
    }
    process.stdout.write('.');
  }
  return out;
}

function saveProgress(filePath, data) {
  data.translations_updated_at = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function translateWithRetry(text, from, to) {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const [out] = await translateTexts([text], { from, to });
      return out;
    } catch (e) {
      const rateLimited = /too many requests/i.test(e.message || '');
      if (!rateLimited || attempt === 7) throw e;
      await new Promise((r) => setTimeout(r, 20000 * (attempt + 1)));
    }
  }
  return text;
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/translate-podcast-transcript.mjs <transcript.json>');
    process.exit(1);
  }

  const filePath = path.resolve(file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const from = data.language?.split('-')[0] || 'fr';
  const sourceParas = (data.paragraphs || []).map((p) => p.text);
  const sourceChapters = (data.chapters || []).map((c) => c.title);

  data.translations = data.translations || {};

  for (const to of TARGETS) {
    if (to === from) continue;
    if (data.translations[to]?.paragraphs?.length === sourceParas.length) {
      console.log(`Skip ${to} (déjà présent)`);
      continue;
    }

    console.log(`\nTraduction ${from} → ${to} (${sourceParas.length} paragraphes)`);

    const summaryTr = await translateWithRetry(
      data.summary || sourceParas[0]?.slice(0, 280) || '',
      from,
      to
    );

    process.stdout.write('  paragraphes');
    const paraTr = await translateList(sourceParas, from, to);
    process.stdout.write('\n  chapitres');
    const chapTr = await translateList(sourceChapters, from, to);
    console.log(' ok');

    data.translations[to] = {
      summary: summaryTr,
      paragraphs: data.paragraphs.map((p, i) => ({
        start: p.start,
        end: p.end,
        text: paraTr[i]?.trim() ? paraTr[i] : p.text,
      })),
      chapters: data.chapters.map((c, i) => ({
        start: c.start,
        title: chapTr[i]?.trim() ? chapTr[i] : c.title,
      })),
    };

    saveProgress(filePath, data);
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log(`\n✓ ${filePath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
