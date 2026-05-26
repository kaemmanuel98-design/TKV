/** Coordonnées approximatives par pays (centre) — pour la carte du Royaume */
const COUNTRY_COORDS = {
  france: [46.2276, 2.2137],
  'royaume-uni': [55.3781, -3.436],
  'united kingdom': [55.3781, -3.436],
  uk: [55.3781, -3.436],
  england: [52.3555, -1.1743],
  belgique: [50.5039, 4.4699],
  belgium: [50.5039, 4.4699],
  suisse: [46.8182, 8.2275],
  switzerland: [46.8182, 8.2275],
  canada: [56.1304, -106.3468],
  'etats-unis': [37.0902, -95.7129],
  'états-unis': [37.0902, -95.7129],
  'united states': [37.0902, -95.7129],
  usa: [37.0902, -95.7129],
  allemagne: [51.1657, 10.4515],
  germany: [51.1657, 10.4515],
  espagne: [40.4637, -3.7492],
  spain: [40.4637, -3.7492],
  italie: [41.8719, 12.5674],
  italy: [41.8719, 12.5674],
  portugal: [39.3999, -8.2245],
  bresil: [14.235, -51.9253],
  brasil: [14.235, -51.9253],
  brazil: [14.235, -51.9253],
  mexique: [23.6345, -102.5528],
  mexico: [23.6345, -102.5528],
  'cote d ivoire': [7.54, -5.5471],
  "cote d'ivoire": [7.54, -5.5471],
  "côte d'ivoire": [7.54, -5.5471],
  'ivory coast': [7.54, -5.5471],
  abidjan: [5.3097, -4.0127],
  senegal: [14.4974, -14.4524],
  sénégal: [14.4974, -14.4524],
  cameroun: [7.3697, 12.3547],
  cameroon: [7.3697, 12.3547],
  'republique democratique du congo': [-4.0383, 21.7587],
  rdc: [-4.0383, 21.7587],
  congo: [-0.228, 15.8277],
  nigeria: [9.082, 8.6753],
  ghana: [7.9465, -1.0232],
  maroc: [31.7917, -7.0926],
  morocco: [31.7917, -7.0926],
  algerie: [28.0339, 1.6596],
  algeria: [28.0339, 1.6596],
  tunisie: [33.8869, 9.5375],
  tunisia: [33.8869, 9.5375],
  egypte: [26.8206, 30.8025],
  egypt: [26.8206, 30.8025],
  'arabie saoudite': [23.8859, 45.0792],
  'saudi arabia': [23.8859, 45.0792],
  emirats: [23.4241, 53.8478],
  'united arab emirates': [23.4241, 53.8478],
  liban: [33.8547, 35.8623],
  lebanon: [33.8547, 35.8623],
  israel: [31.0461, 34.8516],
  turquie: [38.9637, 35.2433],
  turkey: [38.9637, 35.2433],
  inde: [20.5937, 78.9629],
  india: [20.5937, 78.9629],
  chine: [35.8617, 104.1954],
  china: [35.8617, 104.1954],
  japon: [36.2048, 138.2529],
  japan: [36.2048, 138.2529],
  australie: [-25.2744, 133.7751],
  australia: [-25.2744, 133.7751],
  'nouvelle-zelande': [-40.9006, 174.886],
  'new zealand': [-40.9006, 174.886],
  paysbas: [52.1326, 5.2913],
  'pays-bas': [52.1326, 5.2913],
  netherlands: [52.1326, 5.2913],
  hollande: [52.1326, 5.2913],
  haiti: [18.9712, -72.2852],
  'republique dominicaine': [18.7357, -70.1627],
  colombie: [4.5709, -74.2973],
  colombia: [4.5709, -74.2973],
  argentine: [38.4161, -63.6167],
  argentina: [38.4161, -63.6167],
  chili: [-35.6751, -71.543],
  chile: [-35.6751, -71.543],
};

function normalizeCountry(input) {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, "'");
}

/** @returns {[number, number] | null} lat, lng */
export function coordsForCountry(country) {
  if (!country?.trim()) return null;
  const key = normalizeCountry(country);
  return COUNTRY_COORDS[key] || null;
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Léger décalage pour la vie privée (~5–15 km) */
export function jitterCoords([lat, lng], seed) {
  const h = hashString(String(seed));
  const dLat = ((h % 80) - 40) * 0.001;
  const dLng = (((h >> 7) % 80) - 40) * 0.001;
  return [lat + dLat, lng + dLng];
}
