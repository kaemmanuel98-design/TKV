import L from 'leaflet';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Icône maison sur la carte (niveau ville). */
export function createHouseMarkerIcon({ name, isFriend = false, online = false }) {
  const initial = escapeHtml((name || '?').trim().charAt(0).toUpperCase());
  const mod = isFriend ? (online ? ' map-house-marker--friend-online' : ' map-house-marker--friend') : '';

  return L.divIcon({
    className: 'map-house-marker-leaflet',
    html: `<div class="map-house-marker${mod}">
      <span class="map-house-marker__glow"></span>
      <span class="map-house-marker__roof"></span>
      <span class="map-house-marker__body">${initial}</span>
    </div>`,
    iconSize: [40, 46],
    iconAnchor: [20, 46],
    popupAnchor: [0, -42],
  });
}

/** Marqueur pays (agrégat). */
export function createCountryClusterIcon({ count, label }) {
  return L.divIcon({
    className: 'map-country-cluster-leaflet',
    html: `<div class="map-country-cluster">
      <span class="map-country-cluster__ring"></span>
      <span class="map-country-cluster__count">${escapeHtml(count)}</span>
      <span class="map-country-cluster__label">${escapeHtml(label)}</span>
    </div>`,
    iconSize: [80, 56],
    iconAnchor: [40, 28],
    popupAnchor: [0, -26],
  });
}

/** Marqueur ville. */
export function createCityMarkerIcon({ name, count }) {
  return L.divIcon({
    className: 'map-city-marker-leaflet',
    html: `<div class="map-city-marker">
      <span class="map-city-marker__dot"></span>
      <span class="map-city-marker__name">${escapeHtml(name)}</span>
      <span class="map-city-marker__count">${escapeHtml(count)}</span>
    </div>`,
    iconSize: [88, 48],
    iconAnchor: [44, 24],
    popupAnchor: [0, -22],
  });
}
