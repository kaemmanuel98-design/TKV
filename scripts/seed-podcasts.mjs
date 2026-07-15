/**
 * Synchronise les épisodes podcast dans Supabase
 * Usage: node scripts/seed-podcasts.mjs
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const REMOVED_SLUGS = [
  'faith-and-doubt',
  'scripture-living',
  'community-cells',
  'apologetics-gentle',
  'predication-2026-07-12',
  'predication-2026-07-13',
];

const episodes = [
  {
    slug: 'resurrection-probleme-vue',
    title: 'La Puissance de la Résurrection et le Problème de la Vue',
    description: '1 Corinthiens 15 — Christ vivant, vision spirituelle et victoire (~14 min).',
    audio_url: '/audio/podcasts/resurrection-probleme-vue.mp3',
    duration_seconds: 835,
    language: 'fr',
    is_premium: false,
    episode_number: 5,
  },
  {
    slug: 'tunique-couleurs-destinee',
    title: 'La tunique à plusieurs couleurs — Le processus de la destinée',
    description: 'Genèse 37–50 — Joseph, les saisons de la destinée et le timing de Dieu (~16 min).',
    audio_url: '/audio/podcasts/tunique-couleurs-destinee.mp3',
    duration_seconds: 949,
    language: 'fr',
    is_premium: false,
    episode_number: 4,
  },
  {
    slug: 'puissance-grace-faiblesses',
    title: 'La puissance de Sa grâce dans nos faiblesses',
    description: '2 Corinthiens 12 — la grâce suffisante et la force dans la faiblesse (~13 min).',
    audio_url: '/audio/podcasts/puissance-grace-faiblesses.mp3',
    duration_seconds: 761,
    language: 'fr',
    is_premium: false,
    episode_number: 3,
  },
  {
    slug: 'revenons-premier-amour',
    title: 'Revenons à notre premier amour',
    description: "Méditation sur Apocalypse 2:1-7 — revenir à l'amour du Seigneur avant les œuvres (~17 min).",
    audio_url: '/audio/podcasts/revenons-premier-amour.mp3',
    duration_seconds: 1003,
    language: 'fr',
    is_premium: false,
    episode_number: 2,
  },
  {
    slug: 'welcome-voice',
    title: 'Bienvenue dans la Voix du Royaume',
    description: 'Introduction à la mission TKV : une foi rigoureuse et bienveillante pour tous.',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration_seconds: 348,
    language: 'fr',
    is_premium: false,
    episode_number: 1,
  },
];

async function main() {
  for (const slug of REMOVED_SLUGS) {
    const { error } = await supabase.from('podcasts').delete().eq('slug', slug);
    if (error) throw error;
    console.log(`  ✗ supprimé ${slug}`);
  }

  for (const ep of episodes) {
    const { error } = await supabase.from('podcasts').upsert(ep, { onConflict: 'slug' });
    if (error) throw error;
    console.log(`  ✓ ${ep.slug}`);
  }
  console.log(`\n${episodes.length} podcasts synchronisés.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
