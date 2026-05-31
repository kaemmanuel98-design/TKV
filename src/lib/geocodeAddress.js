import { API_BASE, parseApiResponse } from './apiClient';
import { buildQueryVariants, mergeUniqueResults } from './geocodeQuery.js';
import { lookupLocalPlace } from './geocodeLocal.js';
import {
  collectPhotonSuggestions,
  rankSuggestions,
  reverseGeocodePhoton,
} from './geocodePhoton';

function shouldFallback(err) {
  const code = err?.message || '';
  return (
    code === 'api_unreachable' ||
    code === 'server_error' ||
    code === 'request_failed' ||
    code === 'geocode_failed' ||
    code === 'unauthorized' ||
    code === 'not_found' ||
    err?.name === 'TypeError'
  );
}

async function searchViaApi(query, lang, token) {
  const res = await fetch(`${API_BASE}/api/map/geocode/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, lang }),
  });

  if (res.status === 404) return [];
  if (res.status === 400) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || 'geocode_failed');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data?.error || (res.status >= 500 ? 'server_error' : 'request_failed'));
    err.status = res.status;
    throw err;
  }

  const data = await parseApiResponse(res);
  return data?.results || [];
}

async function reverseViaApi(latitude, longitude, lang, token) {
  const res = await fetch(`${API_BASE}/api/map/reverse-geocode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ latitude, longitude, lang }),
  });

  if (res.status === 404) throw new Error('not_found');

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data?.error || (res.status >= 500 ? 'server_error' : 'request_failed'));
    err.status = res.status;
    throw err;
  }

  return parseApiResponse(res);
}

export async function searchAddressSuggestions(query, lang = 'fr', token) {
  const q = query.trim();
  if (q.length < 3) throw new Error('too_short');

  let merged = [];

  try {
    merged = mergeUniqueResults(merged, await searchViaApi(q, lang, token));
  } catch (err) {
    if (err.message === 'too_short') throw err;
    if (!shouldFallback(err)) throw err;
  }

  if (merged.length < 5) {
    for (const variant of buildQueryVariants(q)) {
      merged = mergeUniqueResults(merged, await collectPhotonSuggestions(variant, lang, 5));
      if (merged.length >= 5) break;
    }
  }

  const ranked = rankSuggestions(merged, q);
  if (ranked.length) return ranked.slice(0, 5);

  const local = lookupLocalPlace(q);
  if (local) return [local];

  throw new Error('not_found');
}

export async function geocodeAddress(query, lang = 'fr', token) {
  const results = await searchAddressSuggestions(query, lang, token);
  return results[0];
}

export async function reverseGeocode(latitude, longitude, lang = 'fr', token) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('invalid_coords');
  }

  try {
    return await reverseViaApi(latitude, longitude, lang, token);
  } catch (err) {
    if (err.message === 'not_found' || err.message === 'invalid_coords') throw err;
    if (!shouldFallback(err)) throw err;
  }

  return reverseGeocodePhoton(latitude, longitude, lang);
}
