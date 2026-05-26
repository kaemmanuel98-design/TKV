/** Catalogue local (fallback si Supabase indisponible) */
export const PODCAST_CATALOG = [
  {
    slug: 'welcome-voice',
    titleKey: 'podcast_ep1_title',
    descKey: 'podcast_ep1_desc',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration_seconds: 348,
    is_premium: false,
    episode_number: 1,
  },
  {
    slug: 'faith-and-doubt',
    titleKey: 'podcast_ep2_title',
    descKey: 'podcast_ep2_desc',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration_seconds: 420,
    is_premium: false,
    episode_number: 2,
  },
  {
    slug: 'scripture-living',
    titleKey: 'podcast_ep3_title',
    descKey: 'podcast_ep3_desc',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration_seconds: 390,
    is_premium: true,
    episode_number: 3,
  },
  {
    slug: 'community-cells',
    titleKey: 'podcast_ep4_title',
    descKey: 'podcast_ep4_desc',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration_seconds: 360,
    is_premium: true,
    episode_number: 4,
  },
  {
    slug: 'apologetics-gentle',
    titleKey: 'podcast_ep5_title',
    descKey: 'podcast_ep5_desc',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    duration_seconds: 405,
    is_premium: true,
    episode_number: 5,
  },
];

export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
