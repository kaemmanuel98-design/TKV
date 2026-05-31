import { supabase } from './supabase';

export function mergeBadges(local = [], remote = []) {
  const set = new Set([...(Array.isArray(local) ? local : []), ...(Array.isArray(remote) ? remote : [])]);
  return [...set];
}

export function mergeReadingProgress(local = 0, remote = 0) {
  return Math.min(100, Math.max(0, Math.max(local || 0, remote || 0)));
}

export function gamificationFromProfile(profile) {
  if (!profile) return { badges: [], readingProgress: 0 };
  const badges = Array.isArray(profile.badges) ? profile.badges : [];
  const readingProgress =
    typeof profile.reading_progress === 'number' ? profile.reading_progress : 0;
  return { badges, readingProgress };
}

export async function saveGamificationToProfile(userId, { badges, readingProgress, streakCurrent, streakBest, lastCheckIn }) {
  if (!userId) return;

  const updates = {};
  if (badges != null) updates.badges = badges;
  if (readingProgress != null) updates.reading_progress = Math.min(100, Math.max(0, readingProgress));
  if (streakCurrent != null) updates.streak_current = streakCurrent;
  if (streakBest != null) updates.streak_best = streakBest;
  if (lastCheckIn != null) updates.last_active_date = lastCheckIn;

  if (!Object.keys(updates).length) return;

  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) {
    console.warn('[gamificationSync] save failed', error.message);
  }
}
