/**
 * Active Premium complet sur un profil Supabase (secours admin / fondateur).
 *
 * Usage :
 *   node scripts/grant-premium.mjs <email|uuid>
 *   node scripts/grant-premium.mjs --list
 *
 * Met à jour : is_premium, plan_type, premium_until, can_host_visio,
 *              is_confessional_companion
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const arg = process.argv[2]?.trim();
if (!arg) {
  console.error('Usage: node scripts/grant-premium.mjs <email|uuid>');
  console.error('       node scripts/grant-premium.mjs --list');
  process.exit(1);
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

const premiumUntil = new Date();
premiumUntil.setFullYear(premiumUntil.getFullYear() + 10);

const profileUpdate = {
  is_premium: true,
  plan_type: 'premium',
  premium_until: premiumUntil.toISOString(),
  can_host_visio: true,
  is_confessional_companion: true,
};

async function listRecentUsers() {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 20 });
  if (error) {
    console.error('Erreur auth:', error.message);
    process.exit(1);
  }
  console.log('Utilisateurs récents :');
  for (const u of data.users) {
    console.log(`  ${u.email || '(sans e-mail)'}  →  ${u.id}`);
  }
}

async function resolveUserId(input) {
  if (/^[0-9a-f-]{36}$/i.test(input)) return input;

  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  const match = data.users.find((u) => (u.email || '').toLowerCase() === input.toLowerCase());
  if (!match) throw new Error(`Aucun compte pour : ${input}`);
  return match.id;
}

if (arg === '--list' || arg === '-l') {
  await listRecentUsers();
  process.exit(0);
}

try {
  const userId = await resolveUserId(arg);

  const { data: before } = await admin.from('profiles').select('*').eq('id', userId).maybeSingle();

  const { data, error } = await admin
    .from('profiles')
    .update(profileUpdate)
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) {
    const fallback = { ...profileUpdate };
    delete fallback.is_confessional_companion;
    const retry = await admin.from('profiles').update(fallback).eq('id', userId).select().maybeSingle();
    if (retry.error) {
      console.error('Mise à jour profil:', retry.error.message);
      process.exit(1);
    }
    console.log('OK — Premium activé (sans is_confessional_companion — migration manquante ?)');
    console.log('  utilisateur:', userId);
    console.log('  e-mail:', arg.includes('@') ? arg : '(uuid)');
    console.log('  premium jusqu’au:', premiumUntil.toISOString().slice(0, 10));
    process.exit(0);
  }

  console.log('OK — Accès Premium complet activé');
  console.log('  utilisateur:', userId);
  console.log('  e-mail:', before?.name ? `${before.name}` : arg);
  console.log('  plan:', data?.plan_type);
  console.log('  premium jusqu’au:', premiumUntil.toISOString().slice(0, 10));
  console.log('  can_host_visio:', data?.can_host_visio);
  console.log('  is_confessional_companion:', data?.is_confessional_companion ?? '(colonne absente)');
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
