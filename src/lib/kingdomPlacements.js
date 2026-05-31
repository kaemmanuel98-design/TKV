import {
  coordsForCountry,
  coordsForCountryOrFallback,
  jitterCoords,
  normalizeCountryKey,
  resolveCountryKey,
} from '../data/countryCoords.js';
import { findCityByName, listCitiesForCountry } from '../data/cityCoords.js';

export { normalizeCountryKey };

function parseCoord(value) {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Décalage serré dans une ville (~200–800 m) pour placer les maisons. */
export function houseCoordsInCity(cityCoords, seed) {
  const h = hashString(String(seed));
  const angle = (h % 360) * (Math.PI / 180);
  const radius = 0.003 + (h % 50) * 0.00008;
  const lat = cityCoords[0] + Math.cos(angle) * radius;
  const lng = cityCoords[1] + Math.sin(angle) * radius * 1.2;
  return [lat, lng];
}

export function assignCityForMember(country, cityField, memberId) {
  const explicit = findCityByName(country, cityField);
  if (explicit) return explicit;

  const cities = listCitiesForCountry(country);
  if (cities.length) {
    const idx = hashString(memberId) % cities.length;
    return cities[idx];
  }

  const countryCoords = coordsForCountryOrFallback(country, memberId);
  return {
    id: 'capital',
    name: cityField?.trim() || country,
    coords: countryCoords,
    fallback: true,
  };
}

function cityLabelFromRow(row) {
  if (row.city?.trim()) return row.city.trim();
  if (row.map_address?.trim()) {
    const parts = row.map_address.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) return parts[parts.length - 2];
    return parts[0] || '';
  }
  return '';
}

export function enrichMapMember(row, t) {
  const country = row.country || '';
  const countryKey = resolveCountryKey(country) || normalizeCountryKey(country);
  const countryCoords = coordsForCountryOrFallback(country, row.id);
  const lat = parseCoord(row.latitude);
  const lng = parseCoord(row.longitude);
  const exactLocation = lat != null && lng != null ? [lat, lng] : null;

  const city = exactLocation
    ? {
        id: `pin-${row.id}`,
        name: cityLabelFromRow(row) || country || t('map_you_are_here'),
        coords: exactLocation,
        exact: true,
      }
    : assignCityForMember(country, row.city, row.id);

  const cityCoords = exactLocation || city?.coords || countryCoords;
  const houseLocation = exactLocation || (cityCoords ? houseCoordsInCity(cityCoords, row.id) : null);
  const worldLocation = exactLocation || (countryCoords ? jitterCoords(countryCoords, row.id) : null);

  return {
    id: row.id,
    name: row.name || t('community_author_anonymous'),
    country: country || (exactLocation ? cityLabelFromRow(row) : ''),
    countryKey: resolveCountryKey(country) || normalizeCountryKey(country) || 'monde',
    city: cityLabelFromRow(row) || city?.name || '',
    cityData: city,
    mapAddress: row.map_address || row.mapAddress || '',
    avatarUrl: row.avatar_url || row.avatarUrl || null,
    bio: row.bio || '',
    hasExactCoords: Boolean(exactLocation),
    exactLocation,
    worldLocation,
    cityCoords,
    houseLocation,
    isFriend: Boolean(row.isFriend),
    online: Boolean(row.online),
    lastSeenAt: row.last_seen_at || row.lastSeenAt,
  };
}

export function groupMembersByCountry(members) {
  const map = new Map();
  for (const m of members) {
    if (!m.countryKey || !m.worldLocation) continue;
    const bucket = map.get(m.countryKey) || {
      countryKey: m.countryKey,
      country: m.country,
      location: m.worldLocation,
      members: [],
    };
    bucket.members.push(m);
    map.set(m.countryKey, bucket);
  }
  return [...map.values()];
}

export function groupMembersByCity(members, countryKey) {
  const map = new Map();
  for (const m of members) {
    if (m.countryKey !== countryKey || !m.cityData) continue;
    const id = m.cityData.id;
    const bucket = map.get(id) || {
      cityId: id,
      cityName: m.cityData.name,
      coords: m.cityData.coords,
      members: [],
    };
    bucket.members.push(m);
    map.set(id, bucket);
  }
  return [...map.values()];
}
