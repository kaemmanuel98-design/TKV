import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { fetchCompanionMe } from '../lib/companionApi';
import './RequireCompanion.css';

function deniedMessage(code, t, userEmail) {
  if (code === 'mfa_required') return t('companion_mfa_required');
  if (code === 'api_unreachable' || code === 'server_error') return t('api_error_unreachable');
  if (code === 'unauthorized') return t('require_auth_desc');
  return t('companion_forbidden_desc', { email: userEmail || '—' });
}

export default function RequireCompanion({ children }) {
  const { t } = useTranslation();
  const authLoading = useAuthStore((s) => s.loading);
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState('loading');
  const [denyCode, setDenyCode] = useState('companion_forbidden');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (authLoading) return undefined;

    let cancelled = false;
    (async () => {
      if (!session?.access_token) {
        if (!cancelled) {
          setDenyCode('unauthorized');
          setState('denied');
        }
        return;
      }
      try {
        await fetchCompanionMe(session.access_token);
        if (!cancelled) setState('ok');
      } catch (err) {
        if (!cancelled) {
          setDenyCode(err?.message || 'companion_forbidden');
          setState('denied');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, session?.access_token, retryCount]);

  if (authLoading || state === 'loading') {
    return (
      <div className="require-companion-loading">
        <Loader2 className="spin" size={28} />
        <p>{t('companion_loading')}</p>
      </div>
    );
  }

  if (state === 'denied') {
    const authTo = `/auth?redirect=${encodeURIComponent('/companion')}`;
    return (
      <div className="require-companion card">
        <ShieldAlert size={40} aria-hidden />
        <h1>{t('companion_forbidden_title')}</h1>
        <p>{deniedMessage(denyCode, t, user?.email)}</p>
        {denyCode === 'companion_forbidden' && (
          <p className="require-companion-hint text-muted">{t('companion_forbidden_hint')}</p>
        )}
        <div className="require-companion-actions">
          {denyCode === 'unauthorized' ? (
            <Link to={authTo} className="btn btn-primary">
              {t('layout_login')}
            </Link>
          ) : (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setState('loading');
                setRetryCount((c) => c + 1);
              }}
            >
              {t('companion_retry')}
            </button>
          )}
          <Link to="/" className="btn btn-outline">
            {t('tab_home')}
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
