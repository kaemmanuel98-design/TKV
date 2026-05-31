import { CITIES_BY_COUNTRY } from '../data/cityCoords.js';
import { coordsForCountry, resolveCountryKey } from '../data/countryCoords.js';

function normalizeText(value) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CITY_ENTRIES = Object.entries(CITIES_BY_COUNTRY).flatMap(([countryKey, cities]) =>
  cities.map((city) => ({ countryKey, ...city }))
);

export function lookupLocalPlace(query) {
  const q = normalizeText(query);
  if (q.length < 3) return null;

  for (const city of CITY_ENTRIES) {
    const cityNorm = normalizeText(city.name);
    if (q === cityNorm || q.includes(cityNorm) || cityNorm.includes(q)) {
      return {
        latitude: city.coords[0],
        longitude: city.coords[1],
        country: city.countryKey.replace(/-/g, ' '),
        city: city.name,
        map_address: city.name,
        kind: 'city',
      };
    }
  }

  const countryKey = resolveCountryKey(query);
  const coords = coordsForCountry(query);
  if (countryKey && coords) {
    const label = countryKey.replace(/-/g, ' ');
    return {
      latitude: coords[0],
      longitude: coords[1],
      country: label,
      city: '',
      map_address: label,
      kind: 'country',
    };
  }

  return null;
}
