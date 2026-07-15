/** Langues podcast supportées (alignées sur l'app). */
export const PODCAST_LANGS = ['fr', 'en', 'es', 'nl', 'pt', 'ar'];

export function podcastLangCode(language) {
  return String(language || 'fr').split('-')[0].toLowerCase();
}

function langSuffix(lang) {
  const code = podcastLangCode(lang);
  return code === 'fr' ? '' : `.${code}`;
}

/** URL audio conventionnelle : slug.mp3 (fr) ou slug.en.mp3 */
export function podcastAudioUrlForLang(baseUrl, lang) {
  if (!baseUrl) return null;
  const code = podcastLangCode(lang);
  if (code === 'fr') return baseUrl;
  if (/^https?:\/\//i.test(baseUrl)) return baseUrl;
  return baseUrl.replace(/\.mp3(\?.*)?$/i, `.${code}.mp3$1`);
}

export function podcastTranscriptUrlForLang(baseUrl, lang) {
  if (!baseUrl) return null;
  const code = podcastLangCode(lang);
  if (code === 'fr') return baseUrl;
  return baseUrl.replace(/\.transcript\.json(\?.*)?$/i, `.${code}.transcript.json$1`);
}

let manifestPromise = null;

export async function loadPodcastManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch('/audio/podcasts/manifest.json')
      .then((res) => (res.ok ? res.json() : {}))
      .catch(() => ({}));
  }
  return manifestPromise;
}

/**
 * Résout audio + transcript pour la langue UI, avec repli sur la langue source.
 * @returns {{ audioUrl, transcriptUrl, audioLang, transcriptLang, usedFallback, availableLangs }}
 */
export function resolvePodcastMedia(episode, uiLang, manifest = {}) {
  const slug = episode?.slug;
  const sourceLang = podcastLangCode(episode?.language || 'fr');
  const requested = podcastLangCode(uiLang);
  const entry = slug ? manifest[slug] || {} : {};
  const availableLangs = entry.available || PODCAST_LANGS.filter((l) => entry.audio?.[l]);

  const pickLang = (requestedLang) => {
    if (entry.audio?.[requestedLang]) return requestedLang;
    if (requestedLang !== sourceLang && entry.audio?.[sourceLang]) return sourceLang;
    return sourceLang;
  };

  const audioLang = pickLang(requested);
  const transcriptLang = entry.transcript?.[requested]
    ? requested
    : entry.transcript?.[audioLang]
      ? audioLang
      : sourceLang;

  const audioUrl =
    entry.audio?.[audioLang] ||
    podcastAudioUrlForLang(episode?.audio_url, audioLang) ||
    episode?.audio_url;

  const transcriptUrl =
    entry.transcript?.[transcriptLang] ||
    podcastTranscriptUrlForLang(episode?.transcript_url, transcriptLang) ||
    episode?.transcript_url;

  const durationSeconds =
    entry.duration?.[audioLang] ?? episode?.duration_seconds ?? null;

  return {
    audioUrl,
    transcriptUrl,
    audioLang,
    transcriptLang,
    durationSeconds,
    usedFallback: audioLang !== requested,
    availableLangs: availableLangs.length ? availableLangs : [sourceLang],
  };
}
