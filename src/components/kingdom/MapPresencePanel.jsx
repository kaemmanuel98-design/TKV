import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Loader2, Navigation, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useProfileStore } from '../../store/useProfileStore';
import { searchAddressSuggestions, reverseGeocode } from '../../lib/geocodeAddress';
import { hasMapCoordinates } from '../../lib/profileLocation';

export default function MapPresencePanel({ user, profile, t, lang, onSaved }) {
  const session = useAuthStore((s) => s.session);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const token = session?.access_token;
  const [address, setAddress] = useState('');
  const [showOnMap, setShowOnMap] = useState(false);
  const [busy, setBusy] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const skipProfileSync = useRef(false);

  useEffect(() => {
    if (!profile || skipProfileSync.current) return;
    if (profile.map_address?.trim()) {
      setAddress(profile.map_address.trim());
      setShowOnMap(Boolean(profile.show_on_map));
      return;
    }
    if (hasMapCoordinates(profile)) {
      setShowOnMap(Boolean(profile.show_on_map));
      return;
    }
    const legacy = [profile.city, profile.country].filter(Boolean).join(', ');
    if (legacy) setAddress(legacy);
    setShowOnMap(Boolean(profile.show_on_map));
  }, [profile?.map_address, profile?.latitude, profile?.longitude, profile?.show_on_map, profile?.city, profile?.country]);

  if (!user) {
    return (
      <section className="map-presence kingdom-glass-card">
        <div className="map-presence-head">
          <MapPin size={18} aria-hidden />
          <h2 className="map-presence-title">{t('map_presence_title')}</h2>
        </div>
        <p className="map-presence-hint">{t('map_setup_login')}</p>
        <Link to="/auth" className="btn btn-primary btn-sm map-presence-save">
          {t('layout_login')}
        </Link>
      </section>
    );
  }

  const isVisible = showOnMap && hasMapCoordinates(profile);

  const persistLocation = async (payload) => {
    setError(null);
    try {
      skipProfileSync.current = true;
      setShowOnMap(true);
      await updateProfile(user.id, {
        ...payload,
        show_on_map: true,
      });
      setAddress(payload.map_address || address);
      setSuggestions([]);
      setSaved(true);
      onSaved?.();
      setTimeout(() => {
        setSaved(false);
        skipProfileSync.current = false;
      }, 2800);
    } catch {
      skipProfileSync.current = false;
      setError(t('map_profile_save_error'));
      throw new Error('profile_save_failed');
    }
  };

  const confirmSuggestion = async (result) => {
    setBusy(true);
    setError(null);
    try {
      await persistLocation({
        map_address: result.map_address,
        latitude: result.latitude,
        longitude: result.longitude,
        country: result.country || '',
        city: result.city || '',
      });
    } catch (err) {
      if (err.message !== 'profile_save_failed') setError(t('map_address_error'));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    const query = address.trim();
    if (query.length < 3) {
      setError(t('map_address_too_short'));
      return;
    }
    setBusy(true);
    setError(null);
    setSuggestions([]);
    try {
      const results = await searchAddressSuggestions(query, lang, token);
      if (results.length === 1) {
        await confirmSuggestion(results[0]);
        return;
      }
      setSuggestions(results);
    } catch (err) {
      if (err.message === 'not_found') setError(t('map_address_not_found'));
      else if (err.message === 'too_short') setError(t('map_address_too_short'));
      else setError(t('map_address_error'));
    } finally {
      setBusy(false);
    }
  };

  const handleGeolocate = () => {
    if (!('geolocation' in navigator)) {
      setError(t('map_address_error'));
      return;
    }
    setGeoBusy(true);
    setError(null);
    setSuggestions([]);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const result = await reverseGeocode(latitude, longitude, lang, token);
          await persistLocation({
            map_address: result.map_address,
            latitude: result.latitude,
            longitude: result.longitude,
            country: result.country || '',
            city: result.city || '',
          });
        } catch (err) {
          if (err.message === 'profile_save_failed') return;
          if (err.message === 'not_found') setError(t('map_address_not_found'));
          else setError(t('map_address_error'));
        } finally {
          setGeoBusy(false);
        }
      },
      () => {
        setGeoBusy(false);
        setError(t('map_address_error'));
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const handleToggleVisibility = async () => {
    const next = !showOnMap;
    setShowOnMap(next);
    if (!next) {
      await updateProfile(user.id, { show_on_map: false });
      onSaved?.();
      return;
    }
    if (!hasMapCoordinates(profile) && address.trim().length < 3) {
      setError(t('map_address_need_location'));
      return;
    }
    if (hasMapCoordinates(profile)) {
      await updateProfile(user.id, { show_on_map: true });
      onSaved?.();
    }
  };

  return (
    <section className="map-presence kingdom-glass-card">
      <div className="map-presence-head">
        <MapPin size={18} aria-hidden />
        <h2 className="map-presence-title">{t('map_presence_title')}</h2>
        <span className={`map-presence-badge ${isVisible ? 'map-presence-badge--on' : ''}`}>
          {isVisible ? (
            <>
              <Eye size={13} aria-hidden /> {t('map_presence_visible')}
            </>
          ) : (
            <>
              <EyeOff size={13} aria-hidden /> {t('map_presence_hidden')}
            </>
          )}
        </span>
      </div>

      <p className="map-presence-hint">{t('map_presence_hint')}</p>

      <form onSubmit={handleSaveAddress} className="map-presence-form">
        <label className="map-presence-label" htmlFor="map-address-input">
          {t('map_address_label')}
        </label>
        <input
          id="map-address-input"
          className="map-presence-input"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setSuggestions([]);
            setError(null);
          }}
          placeholder={t('map_address_placeholder')}
          autoComplete="street-address"
          disabled={busy || geoBusy}
        />

        <div className="map-presence-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm map-presence-geo"
            onClick={handleGeolocate}
            disabled={busy || geoBusy}
          >
            {geoBusy ? <Loader2 size={16} className="map-spin" aria-hidden /> : <Navigation size={16} aria-hidden />}
            {t('map_address_geolocate')}
          </button>
          <button type="submit" className="btn btn-primary btn-sm map-presence-save" disabled={busy || geoBusy}>
            {busy ? <Loader2 size={16} className="map-spin" aria-hidden /> : <MapPin size={16} aria-hidden />}
            {t('map_address_save')}
          </button>
        </div>
      </form>

      {suggestions.length > 1 && (
        <div className="map-presence-suggestions">
          <p className="map-presence-suggestions-title">{t('map_address_pick_hint')}</p>
          <ul className="map-presence-suggestions-list">
            {suggestions.map((item) => (
              <li key={`${item.latitude}-${item.longitude}-${item.map_address}`}>
                <button
                  type="button"
                  className="map-presence-suggestion"
                  onClick={() => confirmSuggestion(item)}
                  disabled={busy || geoBusy}
                >
                  <span className="map-presence-suggestion-label">{item.map_address}</span>
                  {item.city && item.country && (
                    <span className="map-presence-suggestion-meta">
                      {item.city}, {item.country}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className="map-presence-toggle">
        <input
          type="checkbox"
          checked={showOnMap}
          onChange={handleToggleVisibility}
          disabled={busy || geoBusy}
        />
        <span>{t('map_show_on_map')}</span>
      </label>

      {error && (
        <p className="map-presence-error" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="map-presence-success" role="status">
          <CheckCircle2 size={15} aria-hidden />
          {t('map_address_saved')}
        </p>
      )}
    </section>
  );
}
