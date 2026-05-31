const CACHE_PREFIX = 'tkv_profile_location_v1';

function parseCoord(value) {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export function getProfileLocationCache(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}:${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      country: parsed.country || '',
      city: parsed.city || '',
      map_address: parsed.map_address || '',
      latitude: parseCoord(parsed.latitude),
      longitude: parseCoord(parsed.longitude),
      show_on_map: Boolean(parsed.show_on_map),
    };
  } catch {
    return null;
  }
}

export function saveProfileLocationCache(userId, partial) {
  if (!userId) return;
  const prev = getProfileLocationCache(userId) || {
    country: '',
    city: '',
    map_address: '',
    latitude: null,
    longitude: null,
    show_on_map: false,
  };
  const next = {
    country: partial.country !== undefined ? partial.country : prev.country,
    city: partial.city !== undefined ? partial.city : prev.city,
    map_address: partial.map_address !== undefined ? partial.map_address : prev.map_address,
    latitude: partial.latitude !== undefined ? parseCoord(partial.latitude) : prev.latitude,
    longitude: partial.longitude !== undefined ? parseCoord(partial.longitude) : prev.longitude,
    show_on_map: partial.show_on_map !== undefined ? partial.show_on_map : prev.show_on_map,
    updatedAt: Date.now(),
  };
  localStorage.setItem(`${CACHE_PREFIX}:${userId}`, JSON.stringify(next));
}

/** Fusionne le cache local si la base ne renvoie pas encore pays/ville/coordonnées. */
export function mergeProfileLocation(profile, userId) {
  if (!profile || !userId) return profile;
  const cache = getProfileLocationCache(userId);
  if (!cache) return profile;

  return {
    ...profile,
    country: profile.country?.trim() ? profile.country : cache.country,
    city: profile.city?.trim() ? profile.city : cache.city,
    map_address: profile.map_address?.trim() ? profile.map_address : cache.map_address,
    latitude: parseCoord(profile.latitude) ?? cache.latitude,
    longitude: parseCoord(profile.longitude) ?? cache.longitude,
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
  if (updates.map_address !== undefined) out.map_address = updates.map_address;
  if (updates.latitude !== undefined) out.latitude = parseCoord(updates.latitude);
  if (updates.longitude !== undefined) out.longitude = parseCoord(updates.longitude);
  if (updates.show_on_map !== undefined) out.show_on_map = updates.show_on_map;
  return out;
}

export function hasMapCoordinates(profile) {
  return parseCoord(profile?.latitude) != null && parseCoord(profile?.longitude) != null;
}

export function locationNeedsDbSync(profile, userId) {
  const cache = getProfileLocationCache(userId);
  if (!cache) return false;
  const needsCity = cache.city?.trim() && !profile?.city?.trim();
  const needsCountry = cache.country?.trim() && !profile?.country?.trim();
  const needsOptIn = cache.show_on_map === true && profile?.show_on_map !== true;
  const needsAddress = cache.map_address?.trim() && !profile?.map_address?.trim();
  const needsLat = cache.latitude != null && parseCoord(profile?.latitude) == null;
  const needsLng = cache.longitude != null && parseCoord(profile?.longitude) == null;
  return needsCity || needsCountry || needsOptIn || needsAddress || needsLat || needsLng;
}
