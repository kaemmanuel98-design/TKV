import { supabase } from './supabase';

const LOCAL_KEY = 'tkv_podcast_progress';

function readLocalMap() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalMap(map) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

export function getLocalPodcastProgress(slug) {
  if (!slug) return null;
  const map = readLocalMap();
  return map[slug] || null;
}

export function saveLocalPodcastProgress(slug, { position_seconds = 0, completed = false } = {}) {
  if (!slug) return;
  const map = readLocalMap();
  map[slug] = {
    position_seconds: Math.max(0, Math.floor(position_seconds)),
    completed: !!completed,
    updated_at: new Date().toISOString(),
  };
  writeLocalMap(map);
}

/** Charge toutes les positions locales par slug. */
export function loadAllLocalPodcastProgress() {
  return readLocalMap();
}

async function resolvePodcastId(episode) {
  if (episode?.id) return episode.id;
  if (!episode?.slug) return null;
  const { data } = await supabase.from('podcasts').select('id').eq('slug', episode.slug).maybeSingle();
  return data?.id || null;
}

/** Fusionne progression distante (par podcast_id) avec le cache local (par slug). */
export async function fetchPodcastProgressForEpisodes(userId, episodes = []) {
  const local = loadAllLocalPodcastProgress();
  if (!userId) return local;

  const { data, error } = await supabase
    .from('podcast_progress')
    .select('podcast_id, position_seconds, completed, updated_at')
    .eq('user_id', userId);

  if (error) {
    console.warn('[podcastProgressSync] fetch failed', error.message);
    return local;
  }

  const byId = Object.fromEntries((data || []).map((r) => [r.podcast_id, r]));

  for (const ep of episodes) {
    const id = ep.id || (await resolvePodcastId(ep));
    if (!id || !ep.slug) continue;
    const remote = byId[id];
    if (!remote) continue;
    const localRow = local[ep.slug];
    const remoteTs = remote.updated_at ? Date.parse(remote.updated_at) : 0;
    const localTs = localRow?.updated_at ? Date.parse(localRow.updated_at) : 0;
    if (!localRow || remoteTs >= localTs) {
      local[ep.slug] = {
        position_seconds: remote.position_seconds ?? 0,
        completed: !!remote.completed,
        updated_at: remote.updated_at || new Date().toISOString(),
      };
    }
  }

  writeLocalMap(local);
  return local;
}

export async function savePodcastProgress(userId, episode, { position_seconds = 0, completed = false } = {}) {
  if (!episode?.slug) return;

  const payload = {
    position_seconds: Math.max(0, Math.floor(position_seconds)),
    completed: !!completed,
    updated_at: new Date().toISOString(),
  };
  saveLocalPodcastProgress(episode.slug, payload);

  if (!userId) return;

  const podcastId = await resolvePodcastId(episode);
  if (!podcastId) return;

  const { error } = await supabase.from('podcast_progress').upsert(
    {
      user_id: userId,
      podcast_id: podcastId,
      position_seconds: payload.position_seconds,
      completed: payload.completed,
      updated_at: payload.updated_at,
    },
    { onConflict: 'user_id,podcast_id' }
  );

  if (error) {
    console.warn('[podcastProgressSync] save failed', error.message);
  }
}
