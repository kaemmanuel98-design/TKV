import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { loadFriendMapMembers, isOnline } from '../lib/friends';
import {
  enrichMapMember,
  groupMembersByCountry,
  groupMembersByCity,
} from '../lib/kingdomPlacements';
import { MapLogo } from '../components/SectionLogos';
import ProfileAvatar from '../components/ProfileAvatar';
import { useProfileStore } from '../store/useProfileStore';
import { hasMapCoordinates } from '../lib/profileLocation';
import { createCityMarkerIcon, createCountryClusterIcon, createHouseMarkerIcon } from '../lib/kingdomMapIcons';
import MapViewportController from '../components/kingdom/MapViewportController';
import KingdomTree from '../components/kingdom/KingdomTree';
import MapPresencePanel from '../components/kingdom/MapPresencePanel';
import HouseExterior from '../components/kingdom/HouseExterior';
import HouseInterior from '../components/kingdom/HouseInterior';
import './MapPage.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

async function fetchMapMembers(currentUserId) {
  const fieldsFull =
    'id, name, country, city, bio, show_on_map, avatar_url, map_address, latitude, longitude';
  const fieldsWithOptIn = 'id, name, country, city, bio, show_on_map, avatar_url';
  const fieldsBasic = 'id, name, country, avatar_url';

  const withCoords = await supabase.from('profiles').select(fieldsFull).eq('show_on_map', true);

  if (!withCoords.error) {
    return (withCoords.data || []).filter(
      (row) => row.country?.trim() || hasMapCoordinates(row)
    );
  }

  const withOptIn = await supabase
    .from('profiles')
    .select(fieldsWithOptIn)
    .eq('show_on_map', true)
    .not('country', 'is', null);

  if (!withOptIn.error) return withOptIn.data || [];

  const fallback = await supabase
    .from('profiles')
    .select(fieldsBasic)
    .not('country', 'is', null);

  if (fallback.error) return [];

  const rows = fallback.data || [];
  if (!currentUserId) return rows;

  return rows.filter((row) => row.show_on_map !== false || row.id === currentUserId);
}

const MapPage = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] || 'fr';
  const { user } = useAuthStore();
  const profile = useProfileStore((s) => s.profile);
  const profileLoading = useProfileStore((s) => s.loading);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const [members, setMembers] = useState([]);
  const [friendMembers, setFriendMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersRefresh, setMembersRefresh] = useState(0);
  const [focus, setFocus] = useState({ level: 'world' });

  useEffect(() => {
    if (user?.id) fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    let cancelled = false;
    if (user?.id && profileLoading) return undefined;

    (async () => {
      setLoading(true);
      const rows = await fetchMapMembers(user?.id);
      let friends = [];
      if (user?.id) {
        try {
          friends = await loadFriendMapMembers(user.id, t);
        } catch {
          friends = [];
        }
      }

      if (cancelled) return;

      const friendIds = new Set(friends.map((f) => f.id));
      const selfRow =
        user?.id &&
        profile?.show_on_map &&
        (profile?.country?.trim() || hasMapCoordinates(profile))
          ? {
              id: user.id,
              name: profile.name || user.user_metadata?.name,
              country: profile.country,
              city: profile.city,
              bio: profile.bio,
              map_address: profile.map_address,
              latitude: profile.latitude,
              longitude: profile.longitude,
              avatar_url: profile.avatar_url || user.user_metadata?.avatar_url,
              show_on_map: profile.show_on_map,
            }
          : null;

      const mergedRows = [...rows];
      if (selfRow && !mergedRows.some((row) => row.id === selfRow.id) && !friendIds.has(selfRow.id)) {
        mergedRows.push(selfRow);
      }

      const friendPlaced = friends
        .map((row) =>
          enrichMapMember(
            {
              ...row,
              isFriend: true,
              online: isOnline(row.lastSeenAt),
            },
            t
          )
        )
        .filter((m) => m.houseLocation);

      const placed = mergedRows
        .filter((row) => !friendIds.has(row.id))
        .map((row) => enrichMapMember(row, t))
        .filter((m) => m.houseLocation);

      setMembers(placed);
      setFriendMembers(friendPlaced);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    t,
    user?.id,
    user?.user_metadata,
    profileLoading,
    profile?.country,
    profile?.city,
    profile?.bio,
    profile?.name,
    profile?.show_on_map,
    profile?.avatar_url,
    profile?.map_address,
    profile?.latitude,
    profile?.longitude,
    membersRefresh,
  ]);

  const allMembers = useMemo(() => [...friendMembers, ...members], [friendMembers, members]);
  const countryGroups = useMemo(() => groupMembersByCountry(allMembers), [allMembers]);
  const cityGroups = useMemo(
    () => (focus.countryKey ? groupMembersByCity(allMembers, focus.countryKey) : []),
    [allMembers, focus.countryKey]
  );
  const cityMembers = useMemo(
    () =>
      focus.level === 'city' && focus.countryKey && focus.cityId
        ? allMembers.filter(
            (m) => m.countryKey === focus.countryKey && m.cityData?.id === focus.cityId && m.houseLocation
          )
        : [],
    [allMembers, focus.level, focus.countryKey, focus.cityId]
  );

  const countryHouseMembers = useMemo(
    () =>
      focus.level === 'country' && focus.countryKey
        ? allMembers.filter((m) => m.countryKey === focus.countryKey && m.houseLocation)
        : [],
    [allMembers, focus.level, focus.countryKey]
  );

  const mapHouseMembers =
    focus.level === 'city' ? cityMembers : focus.level === 'country' ? countryHouseMembers : [];

  const myMember = useMemo(
    () => (user?.id ? allMembers.find((m) => m.id === user.id) : null),
    [allMembers, user?.id]
  );

  useEffect(() => {
    if (!myMember || focus.level !== 'world') return;
    setFocus({
      level: 'city',
      countryKey: myMember.countryKey,
      countryLabel: myMember.country,
      cityId: myMember.cityData?.id,
      cityName: myMember.cityData?.name || myMember.city,
      cityCoords: myMember.hasExactCoords ? myMember.houseLocation : myMember.cityCoords,
    });
  }, [myMember?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- une seule fois au chargement

  const viewport = useMemo(() => {
    if (focus.level === 'city' && focus.cityCoords) {
      const zoom = myMember?.hasExactCoords && focus.cityCoords === myMember.houseLocation ? 15 : 13;
      return { center: focus.cityCoords, zoom };
    }
    if (focus.level === 'country' && focus.countryKey) {
      const group = countryGroups.find((g) => g.countryKey === focus.countryKey);
      if (group?.location) return { center: group.location, zoom: 6 };
    }
    return { center: [20, 0], zoom: 2 };
  }, [focus, countryGroups, myMember?.hasExactCoords, myMember?.houseLocation]);

  const showMap = focus.level === 'world' || focus.level === 'country' || focus.level === 'city';

  const goWorld = () => setFocus({ level: 'world' });
  const goCountry = (group) =>
    setFocus({
      level: 'country',
      countryKey: group.countryKey,
      countryLabel: group.country,
    });
  const goCity = (city, countryGroup) =>
    setFocus({
      level: 'city',
      countryKey: countryGroup?.countryKey || focus.countryKey,
      countryLabel: countryGroup?.country || focus.countryLabel,
      cityId: city.cityId,
      cityName: city.cityName,
      cityCoords: city.coords,
    });
  const goHouse = (member) =>
    setFocus({
      level: 'house',
      countryKey: member.countryKey,
      countryLabel: member.country,
      cityId: member.cityData?.id,
      cityName: member.cityData?.name || member.city,
      cityCoords: member.cityCoords,
      member,
    });
  const goMyHome = () => {
    if (myMember) goHouse(myMember);
  };
  const enterHouse = () => setFocus((f) => ({ ...f, level: 'interior' }));
  const leaveHouse = () => setFocus((f) => ({ ...f, level: 'house' }));
  const backToCity = () =>
    setFocus({
      level: 'city',
      countryKey: focus.countryKey,
      countryLabel: focus.countryLabel,
      cityId: focus.cityId,
      cityName: focus.cityName,
      cityCoords: focus.cityCoords,
    });

  const renderMemberPopup = (member, { showHouseAction = false } = {}) => (
    <Popup>
      <div className="map-popup-avatar">
        <ProfileAvatar src={member.avatarUrl} name={member.name} size={36} />
        <div className="map-popup-meta">
          <strong>{member.name}</strong>
          <span>
            {member.city ? `${member.city}, ` : ''}
            {member.country}
          </span>
          {member.isFriend && (
            <span className={`map-popup-friend-badge ${member.online ? 'map-popup-friend-badge--on' : ''}`}>
              {member.online ? t('friends_status_online') : t('map_friend_label')}
            </span>
          )}
        </div>
      </div>
      {showHouseAction && (
        <button type="button" className="btn btn-primary btn-sm map-popup-chat-btn" onClick={() => goHouse(member)}>
          {t('map_view_house')}
        </button>
      )}
      {member.isFriend && user && member.id !== user.id && (
        <Link to={`/friends/chat/${member.id}`} className="btn btn-outline btn-sm map-popup-chat-btn">
          <MessageCircle size={14} />
          {t('friend_chat_open')}
        </Link>
      )}
    </Popup>
  );

  return (
    <div className="map-page map-shell--kingdom animate-fade-in">
      <header className="map-hero">
        <div className="map-hero-glow" aria-hidden />
        <div className="map-hero-inner container">
          <div className="map-hero-mark">
            <MapLogo size={44} title={t('map_title')} />
          </div>
          <div className="map-hero-copy">
            <p className="map-hero-eyebrow">{t('map_page_eyebrow')}</p>
            <h1 className="map-hero-title">{t('map_title')}</h1>
            <p className="map-hero-subtitle">{t('map_page_subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="container map-body">
      <nav className="kingdom-breadcrumb kingdom-glass-card" aria-label={t('map_levels_title')}>
        <button type="button" className={`kingdom-crumb ${focus.level === 'world' ? 'active' : ''}`} onClick={goWorld}>
          {t('map_level_world')}
        </button>
        {focus.countryLabel && (
          <>
            <ChevronRight size={14} aria-hidden />
            <button
              type="button"
              className={`kingdom-crumb ${focus.level === 'country' ? 'active' : ''}`}
              onClick={() =>
                setFocus({
                  level: 'country',
                  countryKey: focus.countryKey,
                  countryLabel: focus.countryLabel,
                })
              }
            >
              {focus.countryLabel}
            </button>
          </>
        )}
        {focus.cityName && (
          <>
            <ChevronRight size={14} aria-hidden />
            <button
              type="button"
              className={`kingdom-crumb ${focus.level === 'city' ? 'active' : ''}`}
              onClick={backToCity}
            >
              {focus.cityName}
            </button>
          </>
        )}
        {focus.member && (
          <>
            <ChevronRight size={14} aria-hidden />
            <span className="kingdom-crumb active">{t('map_house_of', { name: focus.member.name })}</span>
          </>
        )}
      </nav>

      <div className="map-kingdom-workspace">
        <aside className="map-kingdom-sidebar">
          <MapPresencePanel
            user={user}
            profile={profile}
            t={t}
            lang={lang}
            onSaved={() => {
              if (user?.id) fetchProfile(user.id);
              setMembersRefresh((n) => n + 1);
            }}
          />

          {!loading && allMembers.length > 0 && (
            <KingdomTree
              members={allMembers}
              t={t}
              onSelectCountry={goCountry}
              onSelectCity={goCity}
              onSelectHouse={goHouse}
              activeMemberId={focus.member?.id}
            />
          )}

          {user && friendMembers.length > 0 && showMap && (
            <div className="map-friends-strip kingdom-glass-card">
              <h3 className="map-friends-strip-title">{t('map_friends_list')}</h3>
              <ul className="map-friends-list">
                {friendMembers.map((f) => (
                  <li key={f.id}>
                    <button type="button" className="map-friends-list-link" onClick={() => goHouse(f)}>
                      <ProfileAvatar src={f.avatarUrl} name={f.name} size={32} />
                      <span>{f.name}</span>
                      {f.online && <span className="map-friends-online-dot" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {loading && <p className="map-status">{t('map_loading')}</p>}
          {!loading && allMembers.length === 0 && showMap && (
            <p className="map-status">{t('map_members_empty')}</p>
          )}

          {showMap && (
            <div className="map-sidebar-actions">
              {myMember && focus.level !== 'house' && focus.level !== 'interior' && (
                <button type="button" className="btn btn-primary btn-sm map-my-home-btn" onClick={goMyHome}>
                  {t('map_go_my_home')}
                </button>
              )}
              <div className="map-legend map-legend--pills">
                <span className="map-legend-pill map-legend-pill--friend">{t('map_legend_friend')}</span>
                <span className="map-legend-pill map-legend-pill--member">{t('map_legend_member')}</span>
                {(focus.level === 'city' || focus.level === 'country') && (
                  <span className="map-legend-pill map-legend-pill--house">{t('map_legend_house')}</span>
                )}
              </div>
            </div>
          )}
        </aside>

        <div className="map-kingdom-main">
          {focus.level === 'house' && focus.member && (
            <HouseExterior member={focus.member} t={t} onEnter={enterHouse} onBack={backToCity} />
          )}

          {focus.level === 'interior' && focus.member && (
            <HouseInterior member={focus.member} user={user} t={t} onBack={goWorld} onLeaveHouse={leaveHouse} />
          )}

          {showMap && (
            <>
              <p className="map-level-hint">{t(`map_hint_${focus.level}`)}</p>
              <div className="map-frame kingdom-map-frame">
                <div className="map-frame-chrome">
                  <span className="map-frame-badge">
                    {focus.level === 'world' && t('map_level_world')}
                    {focus.level === 'country' && focus.countryLabel}
                    {focus.level === 'city' && focus.cityName}
                  </span>
                </div>
                <MapContainer
                  center={viewport.center}
                  zoom={viewport.zoom}
                  className="kingdom-leaflet-map"
                  style={{ height: '100%', width: '100%', minHeight: '420px' }}
                  scrollWheelZoom
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap &copy; CARTO'
                  />
            <MapViewportController center={viewport.center} zoom={viewport.zoom} />

            {focus.level === 'world' &&
              countryGroups.map((group) => (
                <Marker
                  key={group.countryKey}
                  position={group.location}
                  icon={createCountryClusterIcon({
                    count: group.members.length,
                    label: group.country,
                  })}
                  eventHandlers={{ click: () => goCountry(group) }}
                >
                  <Popup>
                    <strong>{group.country}</strong>
                    <p>{t('map_country_members', { count: group.members.length })}</p>
                    <button type="button" className="btn btn-primary btn-sm map-popup-chat-btn" onClick={() => goCountry(group)}>
                      {t('map_zoom_cities')}
                    </button>
                  </Popup>
                </Marker>
              ))}

            {focus.level === 'country' &&
              cityGroups.map((city) => (
                <Marker
                  key={city.cityId}
                  position={city.coords}
                  icon={createCityMarkerIcon({ name: city.cityName, count: city.members.length })}
                  eventHandlers={{ click: () => goCity(city, { countryKey: focus.countryKey, country: focus.countryLabel }) }}
                >
                  <Popup>
                    <strong>{city.cityName}</strong>
                    <p>{t('map_city_members', { count: city.members.length })}</p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm map-popup-chat-btn"
                      onClick={() => goCity(city, { countryKey: focus.countryKey, country: focus.countryLabel })}
                    >
                      {t('map_zoom_houses')}
                    </button>
                  </Popup>
                </Marker>
              ))}

            {(focus.level === 'city' || focus.level === 'country') &&
              mapHouseMembers.map((member) => (
                  <Marker
                    key={member.id}
                    position={member.houseLocation}
                    zIndexOffset={member.isFriend ? 500 : 0}
                    icon={
                      member.isFriend
                        ? createAvatarMarkerIcon({
                            avatarUrl: member.avatarUrl,
                            name: member.name,
                            isFriend: true,
                            online: member.online,
                          })
                        : createHouseMarkerIcon({
                            name: member.name,
                            isFriend: member.isFriend,
                            online: member.online,
                          })
                    }
                    eventHandlers={{ click: () => goHouse(member) }}
                  >
                    {renderMemberPopup(member, { showHouseAction: true })}
                  </Marker>
                ))}

          </MapContainer>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default MapPage;
