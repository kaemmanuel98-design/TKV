import React, { useState } from 'react';
import { ArrowLeft, Loader2, UserRound } from 'lucide-react';
import { requestCompanion } from '../../lib/confessionalApi';

export default function ConfessionalCompanion({
  t,
  situation,
  sessionId,
  urgency = false,
  accessToken,
  onBack,
  onOpenChat,
}) {
  const [firstName, setFirstName] = useState('');
  const [availability, setAvailability] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!accessToken) {
      setError(t('confessional_companion_login'));
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await requestCompanion(
        {
          sessionId,
          firstName,
          availability,
          message,
          situation,
          urgency,
        },
        accessToken
      );
      setRequestId(res?.id || null);
      setDone(true);
    } catch {
      setError(t('confessional_companion_error'));
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <section className="confessional-companion card">
        <h2>{t('confessional_companion_done_title')}</h2>
        <p>{t('confessional_companion_done_desc')}</p>
        {requestId && onOpenChat && (
          <button type="button" className="btn btn-primary" onClick={() => onOpenChat(requestId)}>
            {t('companion_chat_user_open')}
          </button>
        )}
        <button type="button" className="btn btn-outline" onClick={onBack}>
          {t('confessional_back_portal')}
        </button>
      </section>
    );
  }

  return (
    <section className="confessional-companion card">
      <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
        <ArrowLeft size={16} /> {t('confessional_back_portal')}
      </button>
      <h2>{t('confessional_companion_title')}</h2>
      {urgency && <p className="confessional-companion-urgent">{t('confessional_companion_urgent_note')}</p>}

      <form onSubmit={submit} className="confessional-companion-form">
        <label className="confessional-label">{t('confessional_companion_firstname')}</label>
        <input
          className="input"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder={t('confessional_companion_firstname_ph')}
          maxLength={60}
        />
        <label className="confessional-label">{t('confessional_companion_availability')}</label>
        <input
          className="input"
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          placeholder={t('confessional_companion_availability_ph')}
          maxLength={120}
        />
        <label className="confessional-label">{t('confessional_companion_message')}</label>
        <textarea
          className="input"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('confessional_companion_message_ph')}
          maxLength={600}
        />
        {error && <p className="confessional-error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? <Loader2 className="spin" size={16} /> : <UserRound size={16} />}
          {t('confessional_companion_submit')}
        </button>
      </form>
    </section>
  );
}
