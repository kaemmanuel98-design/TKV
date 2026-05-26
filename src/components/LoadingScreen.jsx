import React from 'react';
import { useTranslation } from 'react-i18next';
import { LogoMark } from './Logo';

const LoadingScreen = () => {
  const { t } = useTranslation();

  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-logo-mark hero-logo-wrap" style={{ marginBottom: 0 }}>
        <LogoMark size={80} title="TKV — The Kingdom's Voice" />
      </div>
      <p className="loading-logo">TKV</p>
      <p className="text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        The Kingdom&apos;s Voice
      </p>
      <div className="loading-bar" aria-hidden="true" />
      <span className="sr-only">{t('loading_message')}</span>
    </div>
  );
};

export default LoadingScreen;
