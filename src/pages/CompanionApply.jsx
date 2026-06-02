import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle2, HeartHandshake, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import {
  fetchOwnCompanionApplication,
  submitCompanionApplication,
} from '../lib/companionApi';
import './CompanionApply.css';

const CHARTER_KEYS = [
  'companion_charter_1',
  'companion_charter_2',
  'companion_charter_3',
  'companion_charter_4',
  'companion_charter_5',
];

export default function CompanionApply() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/profile');
  };

  const session = useAuthStore((s) => s.session);
  const token = session?.access_token;

  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [motivation, setMotivation] = useState('');
  const [experience, setExperience] = useState('');
  const [church, setChurch] = useState('');
  const [charterOk, setCharterOk] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchOwnCompanionApplication(token)
      .then((data) => setExisting(data.application || null))
      .catch(() => setExisting(null))
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (!token) return;
    setSending(true);
    setError(null);
    try {
      await submitCompanionApplication(
        { motivation, experience, churchAffiliation: church, charterAccepted: charterOk },
        token
      );
      setDone(true);
    } catch (err) {
      const code = err?.message;
      if (code === 'motivation_too_short') setError(t('companion_apply_error_motivation'));
      else if (code === 'charter_required') setError(t('companion_apply_error_charter'));
      else if (code === 'already_applied') setError(t('companion_apply_error_already'));
      else setError(t('companion_apply_error_generic'));
    } finally {
      setSending(false);
    }
  };

  if (!token) {
    return (
      <div className="companion-apply container">
        <p>{t('require_auth_desc')}</p>
        <Link to="/auth" className="btn btn-primary">
          {t('layout_login')}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="companion-apply container">
        <Loader2 className="spin" size={28} />
      </div>
    );
  }

  if (existing && existing.status !== 'rejected' && !done) {
    return (
      <div className="companion-apply container card">
        <HeartHandshake size={32} />
        <h1>{t('companion_apply_status_title')}</h1>
        <p>
          {t(`companion_apply_status_${existing.status}`, {
            defaultValue: existing.status,
          })}
        </p>
        <Link to="/profile" className="btn btn-outline">
          {t('companion_apply_back_profile')}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="companion-apply container card">
        <CheckCircle2 size={36} className="companion-apply-success-icon" />
        <h1>{t('companion_apply_done_title')}</h1>
        <p>{t('companion_apply_done_desc')}</p>
        <Link to="/profile" className="btn btn-primary">
          {t('tab_profile')}
        </Link>
      </div>
    );
  }

  return (
    <div className="companion-apply container">
      <button type="button" className="btn btn-ghost btn-sm" onClick={goBack}>
        <ArrowLeft size={16} /> {t('layout_back')}
      </button>

      <header className="companion-apply-header">
        <HeartHandshake size={28} />
        <h1>{t('companion_apply_title')}</h1>
        <p className="text-muted">{t('companion_apply_lead')}</p>
      </header>

      <section className="card companion-apply-charter">
        <h2>{t('companion_charter_title')}</h2>
        <ul>
          {CHARTER_KEYS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </section>

      <form className="card companion-apply-form" onSubmit={submit}>
        <label className="confessional-label">{t('companion_apply_motivation')}</label>
        <textarea
          className="input"
          rows={5}
          required
          minLength={40}
          maxLength={2000}
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          placeholder={t('companion_apply_motivation_ph')}
        />

        <label className="confessional-label">{t('companion_apply_experience')}</label>
        <textarea
          className="input"
          rows={3}
          maxLength={1200}
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder={t('companion_apply_experience_ph')}
        />

        <label className="confessional-label">{t('companion_apply_church')}</label>
        <input
          className="input"
          maxLength={200}
          value={church}
          onChange={(e) => setChurch(e.target.value)}
          placeholder={t('companion_apply_church_ph')}
        />

        <label className="companion-apply-check">
          <input
            type="checkbox"
            checked={charterOk}
            onChange={(e) => setCharterOk(e.target.checked)}
          />
          {t('companion_apply_charter_accept')}
        </label>

        {error && <p className="confessional-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={sending || !charterOk}>
          {sending ? <Loader2 className="spin" size={16} /> : null}
          {t('companion_apply_submit')}
        </button>
      </form>
    </div>
  );
}
