import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Send, AlertTriangle } from 'lucide-react';
import {
  postConfessionalChat,
  fetchConfessionalSessionMessages,
  closeConfessionalSession,
} from '../../lib/confessionalApi';
import { detectCrisisLevel, maxCrisisLevel, SITUATION_LEVEL } from '../../lib/confessionalCrisis';
import { loadChatDraft, saveChatDraft, clearChatDraft } from '../../lib/confessionalDraft';

export default function ConfessionalChat({
  t,
  situation,
  session,
  initialSessionId,
  accessToken,
  language,
  userId,
  profileCountry,
  onBack,
  onCrisis,
}) {
  const [messages, setMessages] = useState([
    { role: 'ai', content: t('confessional_chat_welcome') },
  ]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(initialSessionId || null);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(Boolean(initialSessionId));
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    if (!initialSessionId || !accessToken) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchConfessionalSessionMessages(initialSessionId, accessToken);
        if (cancelled) return;
        const rows = (data.messages || []).map((m) => ({
          role: m.role === 'ai' ? 'ai' : m.role,
          content: m.content,
        }));
        setMessages(rows.length ? rows : [{ role: 'ai', content: t('confessional_chat_welcome') }]);
      } catch {
        if (!cancelled) setError(t('confessional_chat_error'));
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialSessionId, accessToken, t]);

  useEffect(() => {
    if (initialSessionId || !userId) return;
    const draft = loadChatDraft(userId);
    if (draft?.messages?.length) {
      setMessages(draft.messages);
      if (draft.sessionId) setSessionId(draft.sessionId);
      if (draft.input) setInput(draft.input);
    }
  }, [userId, initialSessionId]);

  useEffect(() => {
    if (!userId) return;
    saveChatDraft(userId, { sessionId, situation, messages, input });
  }, [userId, sessionId, situation, messages, input]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const endSession = async () => {
    if (!sessionId || !accessToken) {
      onBack();
      return;
    }
    try {
      await closeConfessionalSession(sessionId, accessToken);
      clearChatDraft(userId);
    } catch {
      /* ignore */
    }
    onBack();
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending || !accessToken) return;

    const detected = detectCrisisLevel(text);
    const base = SITUATION_LEVEL[situation] || 'medium';
    const level = maxCrisisLevel(detected.level, base);

    if (level === 'critical') {
      onCrisis({ level: 'critical', sessionId, keywords: detected.keywords });
      return;
    }

    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setSending(true);
    setError(null);

    try {
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'ai')
        .map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));

      const data = await postConfessionalChat({
        message: text,
        language,
        situation,
        sessionId,
        history,
        consent: true,
        accessToken,
      });

      if (data.sessionId) setSessionId(data.sessionId);

      if (data.crisisTriggered || data.crisisLevel === 'critical') {
        onCrisis({
          level: data.crisisLevel || 'critical',
          sessionId: data.sessionId,
          keywords: data.keywords,
        });
        return;
      }

      setMessages((m) => [...m, { role: 'ai', content: data.reply }]);

      if (data.crisisLevel === 'high') {
        setMessages((m) => [
          ...m,
          { role: 'system', content: t('confessional_chat_high_hint') },
        ]);
      }
    } catch (err) {
      if (err.data?.error === 'quota_exceeded') {
        setError(t('confessional_chat_quota'));
      } else {
        setError(t('confessional_chat_error'));
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="confessional-chat card">
      <div className="confessional-chat-head">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
          <ArrowLeft size={16} /> {t('confessional_back_portal')}
        </button>
        <span className="confessional-chat-situation">{t(`confessional_situation_${situation}`)}</span>
        {sessionId && (
          <button type="button" className="btn btn-outline btn-sm" onClick={endSession}>
            {t('confessional_chat_close')}
          </button>
        )}
      </div>

      <div className="confessional-chat-feed">
        {loadingHistory && <Loader2 className="spin" size={22} />}
        {messages.map((msg, i) => (
          <div
            key={`${i}-${msg.content.slice(0, 12)}`}
            className={`confessional-chat-msg confessional-chat-msg--${msg.role}`}
          >
            {msg.role === 'system' && <AlertTriangle size={14} />}
            <p>{msg.content}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {error && <p className="confessional-error">{error}</p>}

      <form className="confessional-chat-form" onSubmit={sendMessage}>
        <textarea
          className="input confessional-chat-input"
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('confessional_chat_placeholder')}
          maxLength={2000}
          disabled={sending}
        />
        <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()}>
          {sending ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
        </button>
      </form>
    </section>
  );
}
