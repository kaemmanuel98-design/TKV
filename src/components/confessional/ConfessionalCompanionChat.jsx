import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { fetchUserCompanionChat, sendUserCompanionChat } from '../../lib/companionApi';

export default function ConfessionalCompanionChat({ t, requestId, accessToken, onBack }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  const load = useCallback(async () => {
    if (!accessToken || !requestId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserCompanionChat(requestId, accessToken);
      setMessages(data.messages || []);
    } catch {
      setError(t('companion_chat_user_error'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, requestId, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending || !accessToken) return;
    setSending(true);
    setError(null);
    try {
      const res = await sendUserCompanionChat(requestId, text, accessToken);
      setMessages((m) => [
        ...m,
        {
          id: res.message?.id || Date.now(),
          sender_role: 'user',
          content: text,
          created_at: new Date().toISOString(),
        },
      ]);
      setDraft('');
    } catch {
      setError(t('companion_chat_user_error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="confessional-companion card confessional-companion-chat">
      <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
        <ArrowLeft size={16} /> {t('confessional_back_portal')}
      </button>
      <h2>{t('companion_chat_user_title')}</h2>

      {loading ? (
        <Loader2 className="spin" size={24} />
      ) : (
        <>
          <div className="companion-chat-messages">
            {messages.length === 0 && (
              <p className="text-muted">{t('companion_chat_user_empty')}</p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`companion-chat-bubble companion-chat-${m.sender_role}`}
              >
                {m.content}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          {error && <p className="confessional-error">{error}</p>}
          <form onSubmit={send} className="companion-chat-form">
            <input
              className="input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t('companion_chat_ph')}
              maxLength={2000}
              disabled={sending}
            />
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
