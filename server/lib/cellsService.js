import { getSupabaseAdmin } from './supabaseAdmin.js';

export const OFFICIAL_CELL_SLUGS = new Set(['global', 'fr', 'en', 'es', 'nl', 'pt', 'ar']);
const LANGS = new Set(['fr', 'en', 'es', 'nl', 'pt', 'ar', 'global']);

export function slugifyCellName(name) {
  const base = String(name || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);

  const slug = `c-${base || 'cell'}`;
  return slug.slice(0, 32);
}

async function ensureUniqueSlug(admin, baseSlug) {
  let slug = baseSlug;
  for (let i = 0; i < 20; i += 1) {
    const { data } = await admin.from('cells').select('id').eq('slug', slug).maybeSingle();
    if (!data && !OFFICIAL_CELL_SLUGS.has(slug)) return slug;
    const suffix = i === 0 ? '' : `-${i + 1}`;
    slug = `${baseSlug.slice(0, 32 - suffix.length)}${suffix}`;
  }
  throw new Error('slug_unavailable');
}

export async function listCustomCells() {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const { data, error } = await admin
    .from('cells')
    .select('id, slug, name, description, language, created_by, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    if (/relation.*cells.*does not exist/i.test(error.message || '')) return [];
    throw error;
  }
  return data || [];
}

export async function createCustomCell({ userId, name, description, language }) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('supabase_not_configured');

  const trimmedName = String(name || '').trim();
  if (trimmedName.length < 2 || trimmedName.length > 80) {
    const err = new Error('invalid_name');
    err.code = 'invalid_name';
    throw err;
  }

  const lang = LANGS.has(language) ? language : 'fr';
  const desc = description?.trim() ? String(description).trim().slice(0, 280) : null;
  const slug = await ensureUniqueSlug(admin, slugifyCellName(trimmedName));

  const { data, error } = await admin
    .from('cells')
    .insert({
      slug,
      name: trimmedName,
      description: desc,
      language: lang,
      created_by: userId,
    })
    .select('id, slug, name, description, language, created_by, created_at')
    .single();

  if (error) throw error;
  return data;
}
