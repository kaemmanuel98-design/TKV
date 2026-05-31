const CACHE_PREFIX = 'tkv_profile_location_v1';

export function getProfileLocationCache(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}:${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      country: parsed.country || '',
      city: parsed.city || '',
      show_on_map: Boolean(parsed.show_on_map),
    };
  } catch {
    return null;
  }
}

export function saveProfileLocationCache(userId, partial) {
  if (!userId) return;
  const prev = getProfileLocationCache(userId) || { country: '', city: '', show_on_map: false };
  const next = {
    country: partial.country !== undefined ? partial.country : prev.country,
    city: partial.city !== undefined ? partial.city : prev.city,
    show_on_map: partial.show_on_map !== undefined ? partial.show_on_map : prev.show_on_map,
    updatedAt: Date.now(),
  };
  localStorage.setItem(`${CACHE_PREFIX}:${userId}`, JSON.stringify(next));
}

/** Fusionne le cache local si la base ne renvoie pas encore pays/ville. */
export function mergeProfileLocation(profile, userId) {
  if (!profile || !userId) return profile;
  const cache = getProfileLocationCache(userId);
  if (!cache) return profile;

  return {
    ...profile,
    country: profile.country?.trim() ? profile.country : cache.country,
    city: profile.city?.trim() ? profile.city : cache.city,
    show_on_map:
      profile.show_on_map === true || profile.show_on_map === false
        ? profile.show_on_map
        : cache.show_on_map,
  };
}

export function pickLocationFields(updates) {
  const out = {};
  if (updates.country !== undefined) out.country = updates.country;
  if (updates.city !== undefined) out.city = updates.city;
  if (updates.show_on_map !== undefined) out.show_on_map = updates.show_on_map;
  return out;
}

export function locationNeedsDbSync(profile, userId) {
  const cache = getProfileLocationCache(userId);
  if (!cache) return false;
  const needsCity = cache.city?.trim() && !profile?.city?.trim();
  const needsCountry = cache.country?.trim() && !profile?.country?.trim();
  const needsOptIn = cache.show_on_map === true && profile?.show_on_map !== true;
  return needsCity || needsCountry || needsOptIn;
}
