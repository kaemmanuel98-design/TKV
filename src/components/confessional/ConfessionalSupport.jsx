import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, MessageCircle, Send, UserMinus, UserPlus, Users } from 'lucide-react';
import {
  fetchSupportGroupMessages,
  fetchSupportGroups,
  joinSupportGroup,
  leaveSupportGroup,
  sendSupportGroupMessage,
} from '../../lib/confessionalApi';

export default function ConfessionalSupport({ t, language, accessToken, onBack }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState(null);
  const chatEndRef = useRef(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await fetchSupportGroups(language, accessToken);
      setGroups(data.groups || []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, language]);

  const loadMessages = useCallback(
    async (silent = false) => {
      if (!accessToken || !activeGroup?.id) return;
      if (!silent) setChatLoading(true);
      setChatError(null);
      try {
        const data = await fetchSupportGroupMessages(activeGroup.id, accessToken);
        setMessages(data.messages || []);
      } catch {
        if (!silent) {
          setMessages([]);
          setChatError(t('confessional_support_chat_error'));
        }
      } finally {
        if (!silent) setChatLoading(false);
      }
    },
    [accessToken, activeGroup?.id, t]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (activeGroup?.joined) loadMessages();
    else setMessages([]);
  }, [activeGroup, loadMessages]);

  useEffect(() => {
    if (!activeGroup?.joined || !accessToken) return undefined;
    const timer = setInterval(() => loadMessages(true), 8000);
    return () => clearInterval(timer);
  }, [activeGroup?.joined, activeGroup?.id, accessToken, loadMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggle = async (group) => {
    if (!accessToken) return;
    setBusy(group.id);
    try {
      if (group.joined) {
        await leaveSupportGroup(group.id, accessToken);
        if (activeGroup?.id === group.id) setActiveGroup(null);
      } else {
        await joinSupportGroup(group.id, accessToken);
      }
      await load();
    } finally {
      setBusy(null);
    }
  };

  const openChat = (group) => {
    if (!group.joined) return;
    setActiveGroup(group);
    setDraft('');
    setChatError(null);
  };

  const send = async (e) => {
    e.preventDefault();
    if (!accessToken || !activeGroup?.id || !draft.trim() || sending) return;
    setSending(true);
    setChatError(null);
    try {
      const data = await sendSupportGroupMessage(activeGroup.id, draft.trim(), accessToken);
      setMessages((prev) => [...prev, data.message]);
      setDraft('');
    } catch (err) {
      setChatError(
        err?.message === 'message_blocked'
          ? t('confessional_support_chat_blocked')
          : t('confessional_support_chat_error')
      );
    } finally {
      setSending(false);
    }
  };

  const aliasLabel = (code) => t('confessional_support_alias', { code });

  if (activeGroup) {
    return (
      <section className="confessional-support card">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setActiveGroup(null)}
        >
          <ArrowLeft size={16} /> {t('confessional_support_back_list')}
        </button>
        <h2>{activeGroup.title}</h2>
        <p className="confessional-support-lead">{t('confessional_support_chat_lead')}</p>
        <p className="confessional-support-rules text-muted">{t('confessional_support_chat_rules')}</p>

        <div className="confessional-support-chat">
          {chatLoading ? (
            <Loader2 className="spin" size={24} />
          ) : (
            <ul className="confessional-support-chat-list">
              {messages.length === 0 && (
                <li className="text-muted confessional-support-chat-empty">
                  {t('confessional_support_chat_empty')}
                </li>
              )}
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={`confessional-support-chat-bubble ${m.is_mine ? 'mine' : ''}`}
                >
                  <span className="confessional-support-chat-author">
                    {m.is_mine ? t('confessional_support_you') : aliasLabel(m.member_code)}
                  </span>
                  <p>{m.content}</p>
                </li>
              ))}
              <li ref={chatEndRef} />
            </ul>
          )}
        </div>

        {chatError && <p className="confessional-error">{chatError}</p>}

        <form className="confessional-support-chat-form" onSubmit={send}>
          <input
            type="text"
            className="input"
            maxLength={800}
            placeholder={t('confessional_support_chat_placeholder')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={sending}
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !draft.trim()}>
            {sending ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
            {t('confessional_support_chat_send')}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="confessional-support card">
      <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
        <ArrowLeft size={16} /> {t('confessional_back_portal')}
      </button>
      <h2>{t('confessional_support_title')}</h2>
      <p className="confessional-support-lead">{t('confessional_support_lead')}</p>

      {loading ? (
        <Loader2 className="spin" size={24} />
      ) : (
        <ul className="confessional-support-list">
          {groups.map((g) => (
            <li key={g.id} className="confessional-support-item">
              <div className="confessional-support-item-head">
                <Users size={18} aria-hidden />
                <div>
                  <strong>{g.title}</strong>
                  <span className="confessional-support-count">
                    {t('confessional_support_members', { count: g.member_count })}
                  </span>
                </div>
              </div>
              {g.description && <p className="text-muted">{g.description}</p>}
              <div className="confessional-support-actions">
                <button
                  type="button"
                  className={`btn btn-sm ${g.joined ? 'btn-outline' : 'btn-primary'}`}
                  disabled={busy === g.id}
                  onClick={() => toggle(g)}
                >
                  {busy === g.id ? (
                    <Loader2 className="spin" size={14} />
                  ) : g.joined ? (
                    <UserMinus size={14} />
                  ) : (
                    <UserPlus size={14} />
                  )}
                  {g.joined ? t('confessional_support_leave') : t('confessional_support_join')}
                </button>
                {g.joined && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => openChat(g)}
                  >
                    <MessageCircle size={14} />
                    {t('confessional_support_open_chat')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
