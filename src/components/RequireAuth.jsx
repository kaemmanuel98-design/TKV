import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import MimshackLogo from './MimshackLogo';
import './RequireAuth.css';

const RequireAuth = ({ children, icon: Icon }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (user) return children;

  const redirect = encodeURIComponent(location.pathname + location.search);
  const authTo = `/auth?redirect=${redirect}`;

  return (
    <div className="container require-auth animate-fade-in">
      <div className="require-auth-card card">
        {Icon ? (
          <div className="require-auth-icon" aria-hidden="true">
            <Icon size={56} title="TKV" />
          </div>
        ) : (
          <MimshackLogo size={56} title="Mimshack" />
        )}
        <h1 className="require-auth-title">{t('require_auth_title')}</h1>
        <p className="require-auth-desc">{t('require_auth_desc')}</p>
        <div className="require-auth-actions">
          <Link to={authTo} className="btn btn-primary btn-lg">
            {t('layout_login')}
          </Link>
          <Link to="/" className="btn btn-outline">
            {t('tab_home')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RequireAuth;
