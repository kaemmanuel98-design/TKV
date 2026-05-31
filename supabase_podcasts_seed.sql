-- Seed catalogue podcasts (aligné sur src/data/podcastsCatalog.js)
-- À exécuter après supabase_phase1b_patch.sql pour activer podcast_progress par UUID.

INSERT INTO public.podcasts (slug, title, description, audio_url, duration_seconds, is_premium, episode_number, language)
VALUES
  (
    'welcome-voice',
    'Bienvenue dans la Voix du Royaume',
    'Introduction à la mission TKV.',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    348,
    false,
    1,
    'fr'
  ),
  (
    'faith-and-doubt',
    'Foi et doute : tenir les deux',
    'Accueillir ses questions sans perdre son espérance.',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    420,
    false,
    2,
    'fr'
  ),
  (
    'scripture-living',
    'Une Parole vivante au quotidien',
    'Méditer et appliquer les Écritures.',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    390,
    true,
    3,
    'fr'
  ),
  (
    'community-cells',
    'Cellules : fraternité sans frontières',
    'La force de la communauté.',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    360,
    true,
    4,
    'fr'
  ),
  (
    'apologetics-gentle',
    'Apologétique avec douceur',
    'Dialoguer sans caricature.',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    405,
    true,
    5,
    'fr'
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  audio_url = EXCLUDED.audio_url,
  duration_seconds = EXCLUDED.duration_seconds,
  is_premium = EXCLUDED.is_premium,
  episode_number = EXCLUDED.episode_number;
