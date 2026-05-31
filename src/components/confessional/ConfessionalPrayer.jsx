import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, HeartHandshake, Loader2 } from 'lucide-react';
import {
  createConfessionalPrayer,
  createPrayerDirect,
  fetchConfessionalPrayers,
  fetchPrayersDirect,
  prayForRequest,
  incrementPrayerDirect,
} from '../../lib/confessionalApi';

export default function ConfessionalPrayer({ t, user, session, onBack }) {
  const [prayers, setPrayers] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (session?.access_token) {
        const data = await fetchConfessionalPrayers(session.access_token);
        setPrayers(data.prayers || []);
      } else {
        setPrayers(await fetchPrayersDirect());
      }
    } catch {
      try {
        setPrayers(await fetchPrayersDirect());
      } catch {
        setPrayers([]);
      }
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    load();
  }, [load]);

  const submitPrayer = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !user?.id) return;
    setSubmitting(true);
    setNotice(null);
    try {
      if (session?.access_token) {
        await createConfessionalPrayer(text, session.access_token);
      } else {
        await createPrayerDirect(user.id, text);
      }
      setDraft('');
      setNotice({ type: 'ok', text: t('confessional_prayer_submitted') });
      await load();
    } catch {
      setNotice({ type: 'err', text: t('confessional_prayer_error') });
    } finally {
      setSubmitting(false);
    }
  };

  const markPrayed = async (id) => {
    try {
      if (session?.access_token) {
        await prayForRequest(id, session.access_token);
      } else {
        await incrementPrayerDirect(id);
      }
      await load();
      setNotice({ type: 'ok', text: t('confessional_prayer_thanks') });
    } catch {
      setNotice({ type: 'err', text: t('confessional_prayer_error') });
    }
  };

  return (
    <section className="confessional-prayer card">
      <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
        <ArrowLeft size={16} /> {t('confessional_back_portal')}
      </button>
      <h2>{t('confessional_prayer_title')}</h2>

      <form onSubmit={submitPrayer} className="confessional-prayer-form">
        <textarea
          className="input"
          rows={4}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('confessional_prayer_placeholder')}
          maxLength={800}
        />
        <button type="submit" className="btn btn-primary" disabled={submitting || !draft.trim()}>
          {submitting ? <Loader2 className="spin" size={16} /> : <HeartHandshake size={16} />}
          {t('confessional_prayer_submit')}
        </button>
      </form>

      {notice && <p className={`confessional-notice confessional-notice--${notice.type}`}>{notice.text}</p>}

      <h3>{t('confessional_prayer_wall_title')}</h3>
      {loading ? (
        <p className="text-muted">{t('confessional_loading')}</p>
      ) : prayers.length === 0 ? (
        <p className="text-muted">{t('confessional_prayer_empty')}</p>
      ) : (
        <ul className="confessional-prayer-list">
          {prayers.map((p) => (
            <li key={p.id} className="confessional-prayer-item">
              <p>{p.prayer_text}</p>
              <div className="confessional-prayer-meta">
                <span>{t('confessional_prayer_count', { count: p.prayer_count || 0 })}</span>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => markPrayed(p.id)}>
                  {t('confessional_prayer_prayed')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
