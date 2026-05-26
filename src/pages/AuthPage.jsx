import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogoMark } from '../components/Logo';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);

  const { signIn, signUp } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, { name });
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container animate-fade-in flex justify-center items-center" style={{ minHeight: 'calc(100vh - var(--header-height) - 8rem)' }}>
      <div className="card card-glass" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="text-center mb-6">
          <div className="auth-logo-wrap">
            <LogoMark size={64} title="TKV" />
          </div>
          <h2 className="page-title" style={{ fontSize: '1.75rem' }}>
            {isLogin ? t('auth_login_title') : t('auth_register_title')}
          </h2>
          <p className="text-muted mt-2" style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>
            {isLogin ? t('auth_login_subtitle') : t('auth_register_subtitle')}
          </p>
        </div>

        {error && <div className="form-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">{t('auth_fullname')}</label>
              <input
                id="name"
                type="text"
                className="input"
                placeholder={t('auth_fullname')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="email">{t('auth_email')}</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder={t('auth_email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">{t('auth_password')}</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder={t('auth_password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full mt-2">
            {isLogin ? t('auth_login_btn') : t('auth_register_btn')}
          </button>
        </form>

        <p className="text-center mt-6 text-muted" style={{ fontSize: '0.9375rem' }}>
          {isLogin ? t('auth_no_account') : t('auth_has_account')}{' '}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ display: 'inline-flex', verticalAlign: 'middle' }}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? t('auth_register_btn') : t('auth_login_btn')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
