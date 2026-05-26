/**
 * Upload chunks.json → Supabase (contents + knowledge_chunks + pgvector)
 * Prérequis : supabase_pgvector.sql exécuté, extension vector activée
 *
 * Usage:
 *   npm run upload:chunks              # nécessite embeddings dans chunks.json
 *   npm run upload:chunks -- --embed   # génère embeddings puis upload
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHUNKS_PATH = path.join(__dirname, '../server/data/chunks.json');
const BATCH = 25;

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function embedBatch(texts) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY manquant pour --embed');
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: key });
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts.map((t) => t.slice(0, 8000)),
  });
  return res.data.map((d) => d.embedding);
}

async function ensureEmbeddings(chunks, withEmbedFlag) {
  const missing = chunks.filter((c) => !c.embedding?.length);
  if (!missing.length) return chunks;
  if (!withEmbedFlag) {
    console.error(`${missing.length} chunks sans embedding. Lancez:`);
    console.error('  npm run ingest:knowledge:embed');
    console.error('  ou: npm run upload:chunks -- --embed');
    process.exit(1);
  }
  console.log(`Génération embeddings pour ${missing.length} chunks…`);
  for (let i = 0; i < missing.length; i += BATCH) {
    const batch = missing.slice(i, i + BATCH);
    const vectors = await embedBatch(batch.map((c) => c.chunk_text));
    batch.forEach((c, j) => {
      c.embedding = vectors[j];
    });
    console.log(`  ${Math.min(i + BATCH, missing.length)}/${missing.length}`);
  }
  const raw = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf8'));
  raw.chunks = chunks;
  fs.writeFileSync(CHUNKS_PATH, JSON.stringify(raw));
  console.log('chunks.json mis à jour avec embeddings.');
  return chunks;
}

async function upsertContent(slug, sample) {
  const title = sample.metadata?.title || 'TKV';
  const language = sample.language || 'fr';

  const { data: existing, error: selErr } = await supabase
    .from('contents')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (selErr && selErr.code !== 'PGRST116') {
    if (selErr.message?.includes('slug')) {
      console.warn('Colonne slug absente — exécutez supabase_phase1b_patch.sql');
      const { data: byMeta } = await supabase
        .from('contents')
        .select('id')
        .eq('language', language)
        .eq('title', title)
        .maybeSingle();
      if (byMeta) return byMeta.id;
    } else throw selErr;
  }

  if (existing?.id) {
    await supabase.from('knowledge_chunks').delete().eq('content_id', existing.id);
    return existing.id;
  }

  const row = {
    title,
    content_type: sample.content_type || 'book',
    language,
    metadata: { ...sample.metadata, slug },
    slug,
  };

  const { data, error } = await supabase.from('contents').insert(row).select('id').single();
  if (error) throw error;
  return data.id;
}

async function uploadChunks(chunks, { allowNullEmbedding = false } = {}) {
  const bySlug = new Map();
  for (const c of chunks) {
    if (!bySlug.has(c.content_id)) bySlug.set(c.content_id, []);
    bySlug.get(c.content_id).push(c);
  }

  let totalInserted = 0;

  for (const [slug, group] of bySlug) {
    const contentUuid = await upsertContent(slug, group[0]);
    console.log(`\n📚 ${slug} → ${contentUuid}`);

    for (let i = 0; i < group.length; i += BATCH) {
      const batch = group.slice(i, i + BATCH).map((c) => ({
        content_id: contentUuid,
        content_type: c.content_type,
        chunk_index: c.chunk_index,
        chunk_text: c.chunk_text,
        embedding: allowNullEmbedding ? null : c.embedding,
        metadata: { ...c.metadata, legacy_id: c.id },
        language: c.language,
      }));

      const { error } = await supabase.from('knowledge_chunks').insert(batch);
      if (error) throw error;
      totalInserted += batch.length;
      process.stdout.write(`  +${batch.length} `);
    }
  }

  return totalInserted;
}

async function main() {
  const withEmbed = process.argv.includes('--embed');
  const textOnly = process.argv.includes('--text-only');
  if (!fs.existsSync(CHUNKS_PATH)) {
    console.error('Fichier manquant. Lancez: npm run ingest:knowledge');
    process.exit(1);
  }

  const { chunks } = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf8'));
  console.log(`Chunks à traiter: ${chunks.length}`);

  const ready = textOnly ? chunks : await ensureEmbeddings(chunks, withEmbed);
  const inserted = await uploadChunks(ready, { allowNullEmbedding: textOnly });
  console.log(`\n✓ ${inserted} chunks uploadés dans Supabase.`);
  if (textOnly) {
    console.log('  (sans embeddings — relancez upload:chunks:embed quand le quota OpenAI est OK)');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
