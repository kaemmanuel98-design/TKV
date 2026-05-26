import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { coordsForCountry, jitterCoords } from '../data/countryCoords';
import PageHeader from '../components/PageHeader';
import ProfileAvatar from '../components/ProfileAvatar';
import { useProfileStore } from '../store/useProfileStore';
import { createAvatarMarkerIcon } from '../lib/mapMarkerIcon';
import './MapPage.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

async function fetchMapMembers() {
  const withOptIn = await supabase
    .from('profiles')
    .select('id, name, country, show_on_map, avatar_url')
    .eq('show_on_map', true)
    .not('country', 'is', null);

  if (!withOptIn.error) return withOptIn.data || [];

  const fallback = await supabase
    .from('profiles')
    .select('id, name, country, avatar_url')
    .not('country', 'is', null);

  if (fallback.error) return [];
  return fallback.data || [];
}

const MapPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const profile = useProfileStore((s) => s.profile);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const [userLocation, setUserLocation] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const rows = await fetchMapMembers();
      if (cancelled) return;

      const placed = [];
      const seen = new Set();

      for (const row of rows) {
        const base = coordsForCountry(row.country);
        if (!base) continue;
        const pos = jitterCoords(base, row.id);
        const key = `${pos[0].toFixed(2)}:${pos[1].toFixed(2)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        placed.push({
          id: row.id,
          name: row.name || t('community_author_anonymous'),
          country: row.country,
          avatarUrl: row.avatar_url || null,
          location: pos,
        });
      }

      setMembers(placed);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <div className="container animate-fade-in map-shell">
      <PageHeader eyebrow={t('map')} title={t('map_title')} subtitle={t('map_subtitle')} showLogo />

      {loading && <p className="text-muted map-status">{t('map_loading')}</p>}
      {!loading && members.length === 0 && (
        <p className="text-muted map-status">{t('map_members_empty')}</p>
      )}

      <div className="card map-frame p-0 overflow-hidden">
        <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%', minHeight: '420px' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {members.map((member) => (
            <Marker
              key={member.id}
              position={member.location}
              icon={createAvatarMarkerIcon({
                avatarUrl: member.avatarUrl,
                name: member.name,
              })}
            >
              <Popup>
                <div className="map-popup-avatar">
                  <ProfileAvatar src={member.avatarUrl} name={member.name} size={36} />
                  <div className="map-popup-meta">
                    <strong>{member.name}</strong>
                    <span>{member.country}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {userLocation && (
            <Marker
              position={userLocation}
              icon={createAvatarMarkerIcon({
                avatarUrl: profile?.avatar_url || user?.user_metadata?.avatar_url,
                name: user?.user_metadata?.name || profile?.name,
                size: 44,
              })}
            >
              <Popup>
                <div className="map-popup-avatar">
                  <ProfileAvatar
                    src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                    name={user?.user_metadata?.name || profile?.name}
                    size={36}
                  />
                  <div className="map-popup-meta">
                    <strong>{t('map_you_are_here')}</strong>
                    <span>{user?.user_metadata?.name || t('map_visitor')}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapPage;
