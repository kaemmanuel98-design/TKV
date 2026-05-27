import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogoMark } from '../components/Logo';
import { getAuthErrorKey } from '../lib/authErrors';
import { isSupabaseConfigured, pingSupabaseAuth } from '../lib/supabase';
import { getResendCooldownMs, setResendCooldown } from '../lib/authCooldown';

const MIN_PASSWORD_LENGTH = 8;
const PENDING_EMAIL_KEY = 'tkv_pending_confirm_email';

function resolveRedirectPath(searchParams) {
  const raw = searchParams.get('redirect');
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [resending, setResending] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [connectivityIssue, setConnectivityIssue] = useState(null);

  const { signIn, signUp, resendSignupEmail, resetPassword, updatePassword } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const refreshResendCooldown = useCallback((address) => {
    const ms = getResendCooldownMs(address);
    setResendSeconds(Math.ceil(ms / 1000));
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!isSupabaseConfigured()) {
      setConnectivityIssue('not_configured');
      return undefined;
    }
    pingSupabaseAuth().then((result) => {
      if (cancelled) return;
      if (!result.ok) setConnectivityIssue(result.reason || 'network');
      else setConnectivityIssue(null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(PENDING_EMAIL_KEY);
    if (stored) {
      setPendingEmail(stored);
      setAwaitingEmail(true);
      setInfo(t('auth_confirm_email_desc', { email: stored }));
      refreshResendCooldown(stored);
    }
  }, [t, refreshResendCooldown]);

  useEffect(() => {
    if (searchParams.get('confirmed') === '1') {
      setInfo(t('auth_email_confirmed_hint'));
      setIsLogin(true);
      setAwaitingEmail(false);
      setForgotMode(false);
      localStorage.removeItem(PENDING_EMAIL_KEY);
    }
    if (searchParams.get('reset') === '1') {
      setRecoveryMode(true);
      setForgotMode(false);
      setIsLogin(true);
    }
  }, [searchParams, t]);

  useEffect(() => {
    if (!awaitingEmail || resendSeconds <= 0) return undefined;
    const id = setInterval(() => refreshResendCooldown(pendingEmail), 1000);
    return () => clearInterval(id);
  }, [awaitingEmail, pendingEmail, resendSeconds, refreshResendCooldown]);

  const resolveErrorMessage = (err) => {
    const key = getAuthErrorKey(err);
    if (key) return t(key);
    if (err?.code === 'supabase_not_configured') return t('auth_error_not_configured');
    return err?.message || t('auth_error_generic');
  };

  const showAwaitingEmail = (address, extraInfo) => {
    const trimmed = address.trim();
    localStorage.setItem(PENDING_EMAIL_KEY, trimmed);
    setPendingEmail(trimmed);
    setAwaitingEmail(true);
    setInfo(extraInfo || t('auth_confirm_email_desc', { email: trimmed }));
    setResendCooldown(trimmed, 60);
    refreshResendCooldown(trimmed);
  };

  const handleResend = async () => {
    if (!pendingEmail || resendSeconds > 0) return;
    setError(null);
    setResending(true);
    try {
      await resendSignupEmail(pendingEmail);
      setInfo(t('auth_resend_ok'));
      setResendCooldown(pendingEmail, 60);
      refreshResendCooldown(pendingEmail);
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setInfo(t('auth_forgot_sent', { email: email.trim() }));
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(t('auth_error_weak_password'));
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(newPassword);
      setRecoveryMode(false);
      setNewPassword('');
      navigate(resolveRedirectPath(searchParams));
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!isSupabaseConfigured()) {
      setError(t('auth_error_not_configured'));
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('auth_error_weak_password'));
      return;
    }

    const trimmedEmail = email.trim();

    if (!isLogin && awaitingEmail && trimmedEmail === pendingEmail) {
      setError(t('auth_confirm_email_already'));
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        await signIn(trimmedEmail, password);
        localStorage.removeItem(PENDING_EMAIL_KEY);
        navigate('/');
        return;
      }

      const result = await signUp(trimmedEmail, password, { name: name.trim() });

      if (result.needsEmailConfirmation) {
        const msg = result.alreadyExists
          ? t('auth_confirm_email_already')
          : t('auth_confirm_email_desc', { email: trimmedEmail });
        showAwaitingEmail(trimmedEmail, msg);
        return;
      }

      localStorage.removeItem(PENDING_EMAIL_KEY);
      navigate(resolveRedirectPath(searchParams));
    } catch (err) {
      const key = getAuthErrorKey(err);
      if (key === 'auth_error_email_rate_limit' && pendingEmail) {
        setError(t(key));
        setAwaitingEmail(true);
      } else {
        setError(resolveErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setForgotMode(false);
    setError(null);
    if (!awaitingEmail) setInfo(null);
  };

  if (recoveryMode) {
    return (
      <div
        className="container animate-fade-in flex justify-center items-center"
        style={{ minHeight: 'calc(100vh - var(--header-height) - 8rem)' }}
      >
        <div className="card card-glass" style={{ width: '100%', maxWidth: '420px' }}>
          <div className="text-center mb-6">
            <LogoMark size={64} title="TKV" />
            <h2 className="page-title" style={{ fontSize: '1.75rem', marginTop: '1rem' }}>
              {t('auth_reset_title')}
            </h2>
            <p className="text-muted mt-2">{t('auth_reset_subtitle')}</p>
          </div>
          {error && <div className="form-error mb-4">{error}</div>}
          <form onSubmit={handleRecoverySubmit} className="flex flex-col gap-4">
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('auth_password')}
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
            <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
              {t('auth_reset_submit')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (awaitingEmail) {
    return (
      <div
        className="container animate-fade-in flex justify-center items-center"
        style={{ minHeight: 'calc(100vh - var(--header-height) - 8rem)' }}
      >
        <div className="card card-glass" style={{ width: '100%', maxWidth: '420px' }}>
          <div className="text-center mb-6">
            <div className="auth-logo-wrap">
              <LogoMark size={64} title="TKV" />
            </div>
            <h2 className="page-title" style={{ fontSize: '1.75rem' }}>
              {t('auth_confirm_email_title')}
            </h2>
            <p className="text-muted mt-2" style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>
              {info}
            </p>
          </div>

          {error && <div className="form-error mb-4">{error}</div>}

          <p className="text-muted mb-4" style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
            {t('auth_confirm_email_spam')}
          </p>

          <button
            type="button"
            className="btn btn-outline w-full mb-3"
            disabled={resending || resendSeconds > 0}
            onClick={handleResend}
          >
            {resendSeconds > 0
              ? t('auth_resend_cooldown', { seconds: resendSeconds })
              : t('auth_resend_email')}
          </button>

          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={() => {
              setAwaitingEmail(false);
              setIsLogin(true);
              setEmail(pendingEmail);
              setError(null);
            }}
          >
            {t('auth_confirm_email_login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container animate-fade-in flex justify-center items-center"
      style={{ minHeight: 'calc(100vh - var(--header-height) - 8rem)' }}
    >
      <div className="card card-glass" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="text-center mb-6">
          <div className="auth-logo-wrap">
            <LogoMark size={64} title="TKV" />
          </div>
          <h2 className="page-title" style={{ fontSize: '1.75rem' }}>
            {forgotMode
              ? t('auth_forgot_title')
              : isLogin
                ? t('auth_login_title')
                : t('auth_register_title')}
          </h2>
          <p className="text-muted mt-2" style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>
            {forgotMode
              ? t('auth_forgot_subtitle')
              : isLogin
                ? t('auth_login_subtitle')
                : t('auth_register_subtitle')}
          </p>
        </div>

        {!isSupabaseConfigured() && (
          <div className="form-error mb-4">{t('auth_error_not_configured')}</div>
        )}
        {connectivityIssue === 'network' && isSupabaseConfigured() && (
          <div className="form-error mb-4">{t('auth_error_network')}</div>
        )}
        {error && <div className="form-error mb-4">{error}</div>}
        {info && !error && (
          <div
            className="mb-4"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-elevated)',
              fontSize: '0.875rem',
              lineHeight: 1.5,
            }}
          >
            {info}
          </div>
        )}

        <form
          onSubmit={forgotMode ? handleForgotSubmit : handleSubmit}
          className="flex flex-col gap-4"
        >
          {!isLogin && !forgotMode && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                {t('auth_fullname')}
              </label>
              <input
                id="name"
                type="text"
                className="input"
                placeholder={t('auth_fullname')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              {t('auth_email')}
            </label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder={t('auth_email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          {!forgotMode && (
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                {t('auth_password')}
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder={t('auth_password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              {!isLogin && (
                <p className="text-muted mt-1" style={{ fontSize: '0.8125rem' }}>
                  {t('auth_password_hint')}
                </p>
              )}
              {isLogin && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm auth-forgot-link"
                  onClick={() => {
                    setForgotMode(true);
                    setError(null);
                  }}
                >
                  {t('auth_forgot_link')}
                </button>
              )}
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary w-full mt-2"
            disabled={submitting || !isSupabaseConfigured()}
          >
            {submitting
              ? t('auth_submitting')
              : forgotMode
                ? t('auth_forgot_submit')
                : isLogin
                  ? t('auth_login_btn')
                  : t('auth_register_btn')}
          </button>
        </form>

        {forgotMode ? (
          <p className="text-center mt-6 text-muted" style={{ fontSize: '0.9375rem' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setForgotMode(false);
                setError(null);
              }}
            >
              {t('auth_forgot_back')}
            </button>
          </p>
        ) : (
          <p className="text-center mt-6 text-muted" style={{ fontSize: '0.9375rem' }}>
            {isLogin ? t('auth_no_account') : t('auth_has_account')}{' '}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', verticalAlign: 'middle' }}
              onClick={switchMode}
              disabled={submitting}
            >
              {isLogin ? t('auth_register_btn') : t('auth_login_btn')}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
