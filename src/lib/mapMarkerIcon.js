import L from 'leaflet';

/** Marqueur carte avec photo de profil ou initiale. */
export function createAvatarMarkerIcon({ avatarUrl, name, size = 40, isFriend = false, online = false }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const safeUrl = avatarUrl ? String(avatarUrl).replace(/"/g, '&quot;') : '';
  const classes = [
    'map-avatar-marker',
    isFriend ? 'map-avatar-marker--friend' : '',
    isFriend && online ? 'map-avatar-marker--friend-online' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const inner = safeUrl
    ? `<img src="${safeUrl}" alt="" width="${size}" height="${size}" />`
    : `<span class="map-avatar-marker__initial">${initial}</span>`;

  const html = `<div class="${classes}" style="width:${size}px;height:${size}px">${inner}</div>`;

  return L.divIcon({
    html,
    className: 'map-avatar-marker-leaflet',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4],
  });
}
