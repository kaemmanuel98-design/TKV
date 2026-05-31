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

/** Table `contents` n’accepte que book | course | podcast | article */
const CONTENTS_TYPE_MAP = {
  tkv_book: 'book',
  heritage_history: 'article',
  pastor_teaching: 'article',
  bible_strong: 'article',
  book: 'book',
  course: 'course',
  podcast: 'podcast',
  article: 'article',
};

function contentTypeForContents(mimType) {
  return CONTENTS_TYPE_MAP[mimType] || 'article';
}

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

function persistChunksFile(chunks) {
  const raw = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf8'));
  raw.chunks = chunks;
  raw.embeddedAt = new Date().toISOString();
  fs.writeFileSync(CHUNKS_PATH, JSON.stringify(raw));
}

async function ensureEmbeddings(chunks, withEmbedFlag) {
  const missing = chunks.filter((c) => !c.embedding?.length);
  const done = chunks.length - missing.length;
  if (!missing.length) return chunks;
  if (!withEmbedFlag) {
    console.error(`${missing.length} chunks sans embedding. Lancez:`);
    console.error('  npm run ingest:knowledge:embed');
    console.error('  ou: npm run upload:chunks:embed');
    process.exit(1);
  }
  if (done > 0) {
    console.log(`Reprise : ${done} embeddings déjà présents, ${missing.length} restants.`);
  } else {
    console.log(`Génération embeddings pour ${missing.length} chunks…`);
  }

  const SAVE_EVERY = 20;
  try {
    for (let i = 0; i < missing.length; i += BATCH) {
      const batch = missing.slice(i, i + BATCH);
      const vectors = await embedBatch(batch.map((c) => c.chunk_text));
      batch.forEach((c, j) => {
        c.embedding = vectors[j];
      });
      const progress = Math.min(i + BATCH, missing.length);
      console.log(`  ${done + progress}/${chunks.length}`);
      if ((i / BATCH + 1) % SAVE_EVERY === 0) {
        persistChunksFile(chunks);
        console.log('  (sauvegarde intermédiaire chunks.json)');
      }
    }
  } catch (err) {
    persistChunksFile(chunks);
    const quota =
      err?.code === 'insufficient_quota' ||
      err?.status === 429 ||
      /quota/i.test(err?.message || '');
    if (quota) {
      console.error('\nQuota OpenAI dépassé. Progrès sauvegardé dans chunks.json.');
      console.error('→ Vérifiez facturation : https://platform.openai.com/account/billing');
      console.error('→ Puis relancez : npm run upload:chunks:embed');
      console.error('→ En attendant : npm run upload:chunks:text (recherche par mots-clés uniquement)');
    }
    throw err;
  }

  persistChunksFile(chunks);
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

  const mimType = sample.content_type || sample.metadata?.content_type || 'tkv_book';
  const dbType = contentTypeForContents(mimType);
  const { content_type: _metaCt, ...metaRest } = sample.metadata || {};
  const row = {
    title,
    content_type: dbType,
    language,
    metadata: { ...metaRest, slug, mim_content_type: mimType },
    slug,
  };

  const { data, error } = await supabase.from('contents').insert(row).select('id').single();
  if (error && dbType !== 'book' && mimType === 'tkv_book') {
    const retry = { ...row, content_type: 'book' };
    const second = await supabase.from('contents').insert(retry).select('id').single();
    if (!second.error) return second.data.id;
  }
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
