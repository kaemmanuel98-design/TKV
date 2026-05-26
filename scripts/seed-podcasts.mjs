/**
 * Insère les épisodes podcast de démo dans Supabase
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

const episodes = [
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
  {
    slug: 'faith-and-doubt',
    title: 'Foi et doute : tenir les deux',
    description: 'Comment accueillir ses questions sans perdre son espérance.',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration_seconds: 420,
    language: 'fr',
    is_premium: false,
    episode_number: 2,
  },
  {
    slug: 'scripture-living',
    title: 'Une Parole vivante au quotidien',
    description: 'Méditer et appliquer les Écritures avec l’aide du Saint-Esprit.',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration_seconds: 390,
    language: 'fr',
    is_premium: true,
    episode_number: 3,
  },
  {
    slug: 'community-cells',
    title: 'Cellules : fraternité sans frontières',
    description: 'Pourquoi la communauté change une vie de foi isolée.',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration_seconds: 360,
    language: 'fr',
    is_premium: true,
    episode_number: 4,
  },
  {
    slug: 'apologetics-gentle',
    title: 'Apologétique avec douceur',
    description: 'Dialoguer avec un ami sceptique sans argument gagnant à tout prix.',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    duration_seconds: 405,
    language: 'fr',
    is_premium: true,
    episode_number: 5,
  },
];

async function main() {
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
