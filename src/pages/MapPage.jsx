import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MessageCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { coordsForCountry, jitterCoords } from '../data/countryCoords';
import { loadFriendMapMembers, isOnline } from '../lib/friends';
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
  const [friendMembers, setFriendMembers] = useState([]);
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
      const friends = user?.id ? await loadFriendMapMembers(user.id, t).catch(() => []) : [];

      if (cancelled) return;

      const friendIds = new Set(friends.map((f) => f.id));
      const placed = [];
      const friendPlaced = [];
      const seen = new Set();
      const seenFriends = new Set();

      for (const row of friends) {
        const base = coordsForCountry(row.country);
        if (!base) continue;
        const pos = jitterCoords(base, row.id);
        const key = `f:${pos[0].toFixed(2)}:${pos[1].toFixed(2)}`;
        if (seenFriends.has(key)) continue;
        seenFriends.add(key);
        friendPlaced.push({
          id: row.id,
          name: row.name,
          country: row.country,
          avatarUrl: row.avatarUrl,
          location: pos,
          isFriend: true,
          online: isOnline(row.lastSeenAt),
        });
      }

      for (const row of rows) {
        if (friendIds.has(row.id)) continue;
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
          isFriend: false,
        });
      }

      setMembers(placed);
      setFriendMembers(friendPlaced);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [t, user?.id]);

  const renderPopup = (member) => (
    <Popup>
      <div className="map-popup-avatar">
        <ProfileAvatar src={member.avatarUrl} name={member.name} size={36} />
        <div className="map-popup-meta">
          <strong>{member.name}</strong>
          <span>{member.country}</span>
          {member.isFriend && (
            <span className={`map-popup-friend-badge ${member.online ? 'map-popup-friend-badge--on' : ''}`}>
              {member.online ? t('friends_status_online') : t('map_friend_label')}
            </span>
          )}
        </div>
      </div>
      {member.isFriend && user && member.id !== user.id && (
        <Link to={`/friends/chat/${member.id}`} className="btn btn-primary btn-sm map-popup-chat-btn">
          <MessageCircle size={14} />
          {t('friend_chat_open')}
        </Link>
      )}
    </Popup>
  );

  return (
    <div className="container animate-fade-in map-shell">
      <PageHeader eyebrow={t('map')} title={t('map_title')} subtitle={t('map_subtitle')} showLogo />

      {user && friendMembers.length > 0 && (
        <div className="map-friends-strip card">
          <h3 className="map-friends-strip-title">{t('map_friends_list')}</h3>
          <ul className="map-friends-list">
            {friendMembers.map((f) => (
              <li key={f.id}>
                <Link to={`/friends/chat/${f.id}`} className="map-friends-list-link">
                  <ProfileAvatar src={f.avatarUrl} name={f.name} size={32} />
                  <span>{f.name}</span>
                  {f.online && <span className="map-friends-online-dot" />}
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/friends" className="btn btn-ghost btn-sm">
            {t('friends_nav')}
          </Link>
        </div>
      )}

      {loading && <p className="text-muted map-status">{t('map_loading')}</p>}
      {!loading && members.length === 0 && friendMembers.length === 0 && (
        <p className="text-muted map-status">{t('map_members_empty')}</p>
      )}

      <div className="map-legend">
        <span className="map-legend-item map-legend-item--friend">{t('map_legend_friend')}</span>
        <span className="map-legend-item">{t('map_legend_member')}</span>
      </div>

      <div className="card map-frame p-0 overflow-hidden">
        <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%', minHeight: '420px' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {friendMembers.map((member) => (
            <Marker
              key={`friend-${member.id}`}
              position={member.location}
              zIndexOffset={500}
              icon={createAvatarMarkerIcon({
                avatarUrl: member.avatarUrl,
                name: member.name,
                isFriend: true,
                online: member.online,
              })}
            >
              {renderPopup(member)}
            </Marker>
          ))}

          {members.map((member) => (
            <Marker
              key={member.id}
              position={member.location}
              icon={createAvatarMarkerIcon({
                avatarUrl: member.avatarUrl,
                name: member.name,
              })}
            >
              {renderPopup(member)}
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
