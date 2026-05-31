import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function MapSetupBanner({ user, profile, t }) {
  if (!user) {
    return (
      <div className="map-setup-banner kingdom-glass-card map-setup-banner--warn">
        <AlertCircle size={20} />
        <div>
          <p>{t('map_setup_login')}</p>
          <Link to="/login" className="btn btn-primary btn-sm">
            {t('profile_login_cta')}
          </Link>
        </div>
      </div>
    );
  }

  const missingCountry = !profile?.country?.trim();
  const missingOptIn = !profile?.show_on_map;

  if (!missingCountry && !missingOptIn) return null;

  return (
    <div className="map-setup-banner kingdom-glass-card map-setup-banner--warn">
      <AlertCircle size={20} />
      <div>
        <p>{t('map_setup_profile')}</p>
        <ul className="map-setup-list">
          {missingCountry && <li>{t('map_setup_need_country')}</li>}
          {missingOptIn && <li>{t('map_setup_need_optin')}</li>}
        </ul>
        <Link to="/profile" className="btn btn-primary btn-sm">
          {t('map_setup_go_profile')}
        </Link>
      </div>
    </div>
  );
}
