import { buildQueryVariants, mergeUniqueResults } from './geocodeQuery.js';
import { lookupLocalPlace } from './geocodeLocal.js';

const PHOTON_SEARCH = 'https://photon.komoot.io/api/';
const PHOTON_REVERSE = 'https://photon.komoot.io/reverse';

function formatPhotonAddress(properties = {}, fallback = '') {
  const p = properties;
  const line = [p.housenumber, p.street].filter(Boolean).join(' ');
  const parts = [line || p.name, p.city || p.town || p.village, p.state, p.country].filter(Boolean);
  return parts.join(', ') || fallback.trim();
}

function photonKind(properties = {}) {
  const type = properties.type || properties.osm_value || 'place';
  if (properties.housenumber || properties.street) return 'address';
  if (type === 'house' || type === 'building') return 'address';
  return type;
}

export function parsePhotonFeature(feature, fallbackQuery = '') {
  if (!feature?.geometry?.coordinates?.length) throw new Error('invalid_coords');
  const [longitude, latitude] = feature.geometry.coordinates;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error('invalid_coords');
  const p = feature.properties || {};
  return {
    latitude,
    longitude,
    country: p.country || '',
    city: p.city || p.town || p.village || p.district || p.state || '',
    map_address: formatPhotonAddress(p, fallbackQuery),
    kind: photonKind(p),
  };
}

function scoreSuggestion(result, query) {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const addr = (result.map_address || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let score = 0;
  const words = q.split(/[\s,;]+/).filter((w) => w.length > 2);
  for (const word of words) {
    if (addr.includes(word)) score += 4;
  }
  if (result.kind === 'address' || result.kind === 'house' || result.kind === 'building') score += 6;
  else if (result.kind === 'street') score += 4;
  else if (result.kind === 'city' || result.kind === 'town') score += 1;
  if (words.length >= 2 && result.kind === 'city') score -= 3;
  return score;
}

export function rankSuggestions(results, query) {
  return [...results].sort((a, b) => scoreSuggestion(b, query) - scoreSuggestion(a, query));
}

async function fetchPhotonVariant(query, limit = 5, lang) {
  const q = query.trim();
  if (q.length < 3) return [];

  const paramSets = [
    new URLSearchParams({ q, limit: String(limit), lang: lang || 'fr' }),
    new URLSearchParams({ q, limit: String(limit) }),
  ];

  for (const params of paramSets) {
    try {
      const res = await fetch(`${PHOTON_SEARCH}?${params}`);
      if (!res.ok) continue;
      const data = await res.json();
      const results = (data?.features || []).map((f) => parsePhotonFeature(f, q));
      if (results.length) return results;
    } catch {
      /* try next */
    }
  }
  return [];
}

export async function collectPhotonSuggestions(query, lang = 'fr', limit = 5) {
  const variants = buildQueryVariants(query);
  let merged = [];

  for (const variant of variants) {
    const batch = await fetchPhotonVariant(variant, limit, lang);
    merged = mergeUniqueResults(merged, batch);
    if (merged.length >= limit) break;
  }

  return merged;
}

export async function searchAddressSuggestionsPhoton(query, lang = 'fr', limit = 5) {
  const merged = await collectPhotonSuggestions(query, lang, limit);
  const ranked = rankSuggestions(merged, query);
  if (!ranked.length) {
    const local = lookupLocalPlace(query);
    if (local) return [local];
    throw new Error('not_found');
  }
  return ranked.slice(0, limit);
}

export async function geocodeAddressPhoton(query, lang = 'fr') {
  const ranked = await searchAddressSuggestionsPhoton(query, lang, 5);
  return ranked[0];
}

export async function reverseGeocodePhoton(latitude, longitude, lang = 'fr') {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('invalid_coords');
  }
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    lang: lang || 'fr',
  });
  const res = await fetch(`${PHOTON_REVERSE}?${params}`);
  if (!res.ok) throw new Error('geocode_failed');
  const data = await res.json();
  if (!data?.features?.length) throw new Error('not_found');
  return parsePhotonFeature(data.features[0]);
}
