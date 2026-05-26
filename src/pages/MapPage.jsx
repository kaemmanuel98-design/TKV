import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuthStore } from '../store/useAuthStore';
import PageHeader from '../components/PageHeader';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const goldIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const mockMembers = [
  { id: 1, name: 'Ange Emmanuel', location: [5.30966, -4.01266], city: 'Abidjan, Côte d\'Ivoire' },
  { id: 2, name: 'Jean Dupont', location: [48.8566, 2.3522], city: 'Paris, France' },
  { id: 3, name: 'Sarah Smith', location: [40.7128, -74.0060], city: 'New York, USA' },
];

const MapPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.warn('Geolocation denied or error:', error)
      );
    }
  }, []);

  return (
    <div className="container animate-fade-in map-shell">
      <PageHeader eyebrow={t('map')} title={t('map_title')} subtitle={t('map_subtitle')} showLogo />

      <div className="card map-frame p-0 overflow-hidden">
        <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%', minHeight: '420px' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {mockMembers.map((member) => (
            <Marker key={member.id} position={member.location} icon={goldIcon}>
              <Popup>
                <div style={{ color: '#1A1A1A' }}>
                  <strong>{member.name}</strong>
                  <br />
                  {member.city}
                </div>
              </Popup>
            </Marker>
          ))}

          {userLocation && (
            <Marker position={userLocation}>
              <Popup>
                <div style={{ color: '#1A1A1A' }}>
                  <strong>{t('map_you_are_here')}</strong>
                  <br />
                  {user?.user_metadata?.name || t('map_visitor')}
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
