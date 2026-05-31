import { buildQueryVariants, mergeUniqueResults } from '../../src/lib/geocodeQuery.js';
import { lookupLocalPlace } from '../../src/lib/geocodeLocal.js';

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';
const PHOTON_SEARCH = 'https://photon.komoot.io/api/';
const PHOTON_REVERSE = 'https://photon.komoot.io/reverse';
const USER_AGENT = 'TKV-App/1.0 (Kingdom Map; https://github.com/tkv-app)';

function pickCity(address = {}) {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.suburb ||
    address.county ||
    ''
  );
}

function nominatimKind(hit = {}) {
  if (hit.type === 'house' || hit.class === 'building') return 'address';
  if (hit.type === 'street' || hit.class === 'highway') return 'street';
  return hit.type || 'place';
}

function parseHit(hit, fallbackQuery = '') {
  const addr = hit.address || {};
  const latitude = parseFloat(hit.lat);
  const longitude = parseFloat(hit.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('invalid_coords');
  }
  return {
    latitude,
    longitude,
    country: addr.country || '',
    city: pickCity(addr),
    map_address: hit.display_name || fallbackQuery.trim(),
    kind: nominatimKind(hit),
  };
}

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

function parsePhotonFeature(feature, fallbackQuery = '') {
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

async function nominatimFetch(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  });
  if (!res.ok) throw new Error('geocode_failed');
  return res.json();
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

async function collectPhotonSuggestions(query, lang = 'fr', limit = 5) {
  let merged = [];
  for (const variant of buildQueryVariants(query)) {
    merged = mergeUniqueResults(merged, await fetchPhotonVariant(variant, limit, lang));
    if (merged.length >= limit) break;
  }
  return merged;
}

async function searchNominatimVariant(query, lang = 'fr', limit = 5) {
  const q = query.trim();
  const params = new URLSearchParams({
    q,
    format: 'json',
    limit: String(Math.min(Math.max(limit, 1), 8)),
    addressdetails: '1',
    'accept-language': lang,
  });
  try {
    const data = await nominatimFetch(`${NOMINATIM_SEARCH}?${params}`);
    if (!Array.isArray(data) || !data.length) return [];
    return data.map((hit) => parseHit(hit, q));
  } catch {
    return [];
  }
}

export async function searchAddressSuggestions(query, lang = 'fr', limit = 5) {
  const q = query.trim();
  if (q.length < 3) throw new Error('too_short');

  let merged = [];

  for (const variant of buildQueryVariants(q)) {
    merged = mergeUniqueResults(merged, await searchNominatimVariant(variant, lang, limit));
    if (merged.length >= limit) break;
  }

  if (merged.length < limit) {
    for (const variant of buildQueryVariants(q)) {
      merged = mergeUniqueResults(merged, await collectPhotonSuggestions(variant, lang, limit));
      if (merged.length >= limit) break;
    }
  }

  const ranked = rankSuggestions(merged, q);
  if (ranked.length) return ranked.slice(0, limit);

  const local = lookupLocalPlace(q);
  if (local) return [local];

  throw new Error('not_found');
}

export async function geocodeAddressQuery(query, lang = 'fr') {
  const ranked = await searchAddressSuggestions(query, lang, 5);
  return ranked[0];
}

export async function reverseGeocodeCoords(latitude, longitude, lang = 'fr') {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('invalid_coords');

  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
      addressdetails: '1',
      'accept-language': lang,
    });
    const hit = await nominatimFetch(`${NOMINATIM_REVERSE}?${params}`);
    if (!hit?.lat) throw new Error('not_found');
    return parseHit(hit);
  } catch (err) {
    if (err.message === 'invalid_coords' || err.message === 'not_found') throw err;
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      lang: lang || 'fr',
    });
    const res = await fetch(`${PHOTON_REVERSE}?${params}`);
    if (!res.ok) throw new Error('geocode_failed');
    const data = await res.json();
    if (!data?.features?.length) throw new Error('not_found');
    return parsePhotonFeature(data.features[0]);
  }
}
