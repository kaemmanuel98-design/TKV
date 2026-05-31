import { resolveCountryKey } from '../data/countryCoords.js';

/** Villes principales par pays (centre cartographique). */
export const CITIES_BY_COUNTRY = {
  france: [
    { id: 'paris', name: 'Paris', coords: [48.8566, 2.3522] },
    { id: 'lyon', name: 'Lyon', coords: [45.764, 4.8357] },
    { id: 'marseille', name: 'Marseille', coords: [43.2965, 5.3698] },
  ],
  belgique: [
    { id: 'bruxelles', name: 'Bruxelles', coords: [50.8503, 4.3517] },
    { id: 'liege', name: 'Liège', coords: [50.6326, 5.5797] },
  ],
  belgium: [
    { id: 'bruxelles', name: 'Brussels', coords: [50.8503, 4.3517] },
    { id: 'liege', name: 'Liège', coords: [50.6326, 5.5797] },
  ],
  canada: [
    { id: 'montreal', name: 'Montréal', coords: [45.5017, -73.5673] },
    { id: 'quebec', name: 'Québec', coords: [46.8139, -71.208] },
    { id: 'toronto', name: 'Toronto', coords: [43.6532, -79.3832] },
  ],
  "cote d'ivoire": [
    { id: 'abidjan', name: 'Abidjan', coords: [5.3097, -4.0127] },
    { id: 'yamoussoukro', name: 'Yamoussoukro', coords: [6.8276, -5.2893] },
    { id: 'bouake', name: 'Bouaké', coords: [7.6939, -5.0303] },
  ],
  senegal: [
    { id: 'dakar', name: 'Dakar', coords: [14.7167, -17.4677] },
    { id: 'saint-louis', name: 'Saint-Louis', coords: [16.0179, -16.4896] },
  ],
  cameroun: [
    { id: 'douala', name: 'Douala', coords: [4.0511, 9.7679] },
    { id: 'yaounde', name: 'Yaoundé', coords: [3.848, 11.5021] },
  ],
  cameroon: [
    { id: 'douala', name: 'Douala', coords: [4.0511, 9.7679] },
    { id: 'yaounde', name: 'Yaoundé', coords: [3.848, 11.5021] },
  ],
  'united states': [
    { id: 'new-york', name: 'New York', coords: [40.7128, -74.006] },
    { id: 'los-angeles', name: 'Los Angeles', coords: [34.0522, -118.2437] },
    { id: 'houston', name: 'Houston', coords: [29.7604, -95.3698] },
  ],
  'united kingdom': [
    { id: 'london', name: 'London', coords: [51.5074, -0.1278] },
    { id: 'manchester', name: 'Manchester', coords: [53.4808, -2.2426] },
  ],
  allemagne: [
    { id: 'berlin', name: 'Berlin', coords: [52.52, 13.405] },
    { id: 'munich', name: 'Munich', coords: [48.1351, 11.582] },
  ],
  germany: [
    { id: 'berlin', name: 'Berlin', coords: [52.52, 13.405] },
    { id: 'munich', name: 'Munich', coords: [48.1351, 11.582] },
  ],
  espagne: [
    { id: 'madrid', name: 'Madrid', coords: [40.4168, -3.7038] },
    { id: 'barcelona', name: 'Barcelone', coords: [41.3851, 2.1734] },
  ],
  spain: [
    { id: 'madrid', name: 'Madrid', coords: [40.4168, -3.7038] },
    { id: 'barcelona', name: 'Barcelona', coords: [41.3851, 2.1734] },
  ],
  haiti: [
    { id: 'port-au-prince', name: 'Port-au-Prince', coords: [18.5944, -72.3074] },
    { id: 'cap-haitien', name: 'Cap-Haïtien', coords: [19.7596, -72.1982] },
  ],
  nigeria: [
    { id: 'lagos', name: 'Lagos', coords: [6.5244, 3.3792] },
    { id: 'abuja', name: 'Abuja', coords: [9.0765, 7.3986] },
  ],
  maroc: [
    { id: 'casablanca', name: 'Casablanca', coords: [33.5731, -7.5898] },
    { id: 'rabat', name: 'Rabat', coords: [34.0209, -6.8416] },
  ],
  morocco: [
    { id: 'casablanca', name: 'Casablanca', coords: [33.5731, -7.5898] },
    { id: 'rabat', name: 'Rabat', coords: [34.0209, -6.8416] },
  ],
  paysbas: [
    { id: 'amsterdam', name: 'Amsterdam', coords: [52.3676, 4.9041] },
    { id: 'rotterdam', name: 'Rotterdam', coords: [51.9244, 4.4777] },
  ],
  netherlands: [
    { id: 'amsterdam', name: 'Amsterdam', coords: [52.3676, 4.9041] },
    { id: 'rotterdam', name: 'Rotterdam', coords: [51.9244, 4.4777] },
  ],
  portugal: [
    { id: 'lisbonne', name: 'Lisbonne', coords: [38.7223, -9.1393] },
    { id: 'porto', name: 'Porto', coords: [41.1579, -8.6291] },
  ],
  bresil: [
    { id: 'sao-paulo', name: 'São Paulo', coords: [-23.5505, -46.6333] },
    { id: 'rio', name: 'Rio de Janeiro', coords: [-22.9068, -43.1729] },
  ],
  brazil: [
    { id: 'sao-paulo', name: 'São Paulo', coords: [-23.5505, -46.6333] },
    { id: 'rio', name: 'Rio de Janeiro', coords: [-22.9068, -43.1729] },
  ],
};

export function listCitiesForCountry(country) {
  const key = resolveCountryKey(country);
  if (!key) return [];
  return CITIES_BY_COUNTRY[key] || [];
}

export function findCityByName(country, cityName) {
  if (!cityName?.trim()) return null;
  const stripAccents = (s) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  const norm = stripAccents(cityName.trim());
  const cities = listCitiesForCountry(country);
  return (
    cities.find((c) => stripAccents(c.name) === norm) ||
    cities.find((c) => c.id === norm.replace(/\s+/g, '-')) ||
    null
  );
}
