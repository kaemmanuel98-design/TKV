/** Catalogue local (fallback si Supabase indisponible) */
export const PODCAST_CATALOG = [
  {
    slug: 'resurrection-probleme-vue',
    titleKey: 'podcast_resurrection_vue_title',
    descKey: 'podcast_resurrection_vue_desc',
    audio_url: '/audio/podcasts/resurrection-probleme-vue.mp3',
    transcript_url: '/audio/podcasts/resurrection-probleme-vue.transcript.json',
    duration_seconds: 835,
    is_premium: false,
    episode_number: 5,
    content_type: 'sermon',
    language: 'fr',
  },
  {
    slug: 'tunique-couleurs-destinee',
    titleKey: 'podcast_tunique_destinee_title',
    descKey: 'podcast_tunique_destinee_desc',
    audio_url: '/audio/podcasts/tunique-couleurs-destinee.mp3',
    transcript_url: '/audio/podcasts/tunique-couleurs-destinee.transcript.json',
    duration_seconds: 949,
    is_premium: false,
    episode_number: 4,
    content_type: 'sermon',
    language: 'fr',
  },
  {
    slug: 'puissance-grace-faiblesses',
    titleKey: 'podcast_grace_faiblesses_title',
    descKey: 'podcast_grace_faiblesses_desc',
    audio_url: '/audio/podcasts/puissance-grace-faiblesses.mp3',
    transcript_url: '/audio/podcasts/puissance-grace-faiblesses.transcript.json',
    duration_seconds: 761,
    is_premium: false,
    episode_number: 3,
    content_type: 'sermon',
    language: 'fr',
  },
  {
    slug: 'revenons-premier-amour',
    titleKey: 'podcast_premier_amour_title',
    descKey: 'podcast_premier_amour_desc',
    audio_url: '/audio/podcasts/revenons-premier-amour.mp3',
    transcript_url: '/audio/podcasts/revenons-premier-amour.transcript.json',
    duration_seconds: 1003,
    is_premium: false,
    episode_number: 2,
    content_type: 'sermon',
    language: 'fr',
  },
  {
    slug: 'welcome-voice',
    titleKey: 'podcast_ep1_title',
    descKey: 'podcast_ep1_desc',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration_seconds: 348,
    is_premium: false,
    episode_number: 1,
  },
];

export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
