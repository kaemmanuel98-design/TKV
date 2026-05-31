import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeft,
  Circle,
  Loader2,
  MessageCircle,
  Send,
  Siren,
  StickyNote,
  BookOpen,
} from 'lucide-react';
import { CONFESSIONAL_RESOURCES, CONFESSIONAL_RESOURCE_DETAILS } from '../data/confessionalResources';
import { useAuthStore } from '../store/useAuthStore';
import {
  requestCompanionNotificationPermission,
  useCompanionCrisisAlerts,
} from '../hooks/useCompanionCrisisAlerts';
import {
  assignCompanionRequest,
  fetchCompanionChatMessages,
  fetchCompanionCrises,
  fetchCompanionMe,
  fetchCompanionQueue,
  fetchCompanionRequest,
  fetchCompanionTeam,
  transferCompanionRequest,
  patchCompanionAvailability,
  patchCompanionRequestStatus,
  postCompanionEmergency,
  postCompanionNote,
  sendCompanionChatMessage,
} from '../lib/companionApi';
import './CompanionDashboard.css';

const AVAIL = ['online', 'busy', 'offline'];

export default function CompanionDashboard() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] || 'fr';
  const session = useAuthStore((s) => s.session);
  const token = session?.access_token;

  const [me, setMe] = useState(null);
  const [queue, setQueue] = useState([]);
  const [crises, setCrises] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [team, setTeam] = useState([]);
  const [transferTo, setTransferTo] = useState('');
  const chatEndRef = useRef(null);
  const [notifyState, setNotifyState] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  useCompanionCrisisAlerts(token, Boolean(me), t);

  const loadOverview = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const [meRes, queueRes, crisisRes] = await Promise.all([
        fetchCompanionMe(token),
        fetchCompanionQueue(token),
        fetchCompanionCrises(token),
      ]);
      setMe(meRes.me);
      setQueue(queueRes.queue || []);
      setCrises(crisisRes.crises || []);
    } catch {
      setError(t('companion_error_load'));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  const loadDetail = useCallback(
    async (id) => {
      if (!token || !id) return;
      try {
        const data = await fetchCompanionRequest(id, token);
        setDetail(data);
        const chat = await fetchCompanionChatMessages(id, token);
        setMessages(chat.messages || []);
      } catch {
        setError(t('companion_error_load'));
      }
    },
    [token, t]
  );

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
    else {
      setDetail(null);
      setMessages([]);
    }
  }, [selectedId, loadDetail]);

  useEffect(() => {
    if (!token || !selectedId) return undefined;
    const timer = setInterval(async () => {
      try {
        const chat = await fetchCompanionChatMessages(selectedId, token);
        setMessages(chat.messages || []);
      } catch {
        /* ignore poll */
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [token, selectedId]);

  useEffect(() => {
    if (!token) return;
    fetchCompanionTeam(token)
      .then((data) => setTeam(data.team || []))
      .catch(() => setTeam([]));
  }, [token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const setAvailability = async (availability) => {
    if (!token) return;
    await patchCompanionAvailability(availability, token);
    setMe((m) => (m ? { ...m, companion_availability: availability } : m));
  };

  const pickRequest = (id) => setSelectedId(id);

  const handleAssign = async () => {
    if (!token || !selectedId) return;
    setSending(true);
    try {
      await assignCompanionRequest(selectedId, token);
      await loadOverview();
      await loadDetail(selectedId);
    } catch {
      setError(t('companion_error_action'));
    } finally {
      setSending(false);
    }
  };

  const handleStatus = async (status) => {
    if (!token || !selectedId) return;
    await patchCompanionRequestStatus(selectedId, status, token);
    await loadOverview();
    await loadDetail(selectedId);
  };

  const handleTransfer = async () => {
    if (!token || !selectedId || !transferTo) return;
    if (!window.confirm(t('companion_transfer_confirm'))) return;
    try {
      await transferCompanionRequest(selectedId, transferTo, token);
      setTransferTo('');
      await loadOverview();
      setSelectedId(null);
    } catch {
      setError(t('companion_error_action'));
    }
  };

  const handleEmergency = async () => {
    if (!token || !selectedId) return;
    if (!window.confirm(t('companion_emergency_confirm'))) return;
    await postCompanionEmergency(selectedId, token);
    await loadOverview();
    await loadDetail(selectedId);
  };

  const handleNote = async (e) => {
    e.preventDefault();
    if (!token || !selectedId || !noteDraft.trim()) return;
    await postCompanionNote(selectedId, noteDraft.trim(), token);
    setNoteDraft('');
    await loadDetail(selectedId);
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!token || !selectedId || !chatDraft.trim()) return;
    setSending(true);
    try {
      const res = await sendCompanionChatMessage(selectedId, chatDraft.trim(), token);
      setMessages((m) => [...m, { ...res.message, sender_role: 'companion', content: chatDraft.trim() }]);
      setChatDraft('');
      if (detail?.request?.status === 'assigned') {
        await patchCompanionRequestStatus(selectedId, 'in_progress', token);
        await loadDetail(selectedId);
      }
    } finally {
      setSending(false);
    }
  };

  const selected = queue.find((q) => q.id === selectedId);
  const canChat = detail?.request?.status === 'assigned' || detail?.request?.status === 'in_progress';

  return (
    <div className="companion-dash">
      <header className="companion-dash-header">
        <Link to="/" className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> TKV
        </Link>
        <div>
          <h1>{t('companion_dashboard_title')}</h1>
          <p className="text-muted">{t('companion_dashboard_subtitle')}</p>
        </div>
        {notifyState !== 'unsupported' && notifyState !== 'granted' && (
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={async () => {
              const p = await requestCompanionNotificationPermission(token);
              setNotifyState(
                p === 'registered' || p === 'granted' ? 'granted' : p
              );
            }}
          >
            {t('companion_notify_enable')}
          </button>
        )}
        <div className="companion-avail-group">
          {AVAIL.map((a) => (
            <button
              key={a}
              type="button"
              className={`btn btn-sm ${me?.companion_availability === a ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setAvailability(a)}
            >
              <Circle
                size={10}
                className={`companion-avail-dot companion-avail-${a}`}
                fill="currentColor"
              />
              {t(`companion_avail_${a}`)}
            </button>
          ))}
        </div>
      </header>

      {crises.length > 0 && (
        <aside className="companion-crisis-banner card">
          <AlertTriangle size={20} />
          <span>{t('companion_crisis_alert', { count: crises.length })}</span>
        </aside>
      )}

      {error && <p className="confessional-error">{error}</p>}

      <section className="companion-resources card">
        <h2>
          <BookOpen size={20} /> {t('confessional_resources_title')}
        </h2>
        <ul className="companion-resources-list">
          {CONFESSIONAL_RESOURCES.map((res) => (
            <li key={res.id}>
              <strong>{t(res.titleKey)}</strong>
              <p className="text-muted">{t(res.descKey)}</p>
              {CONFESSIONAL_RESOURCE_DETAILS[res.id] && (
                <ul>
                  {(CONFESSIONAL_RESOURCE_DETAILS[res.id][lang] ||
                    CONFESSIONAL_RESOURCE_DETAILS[res.id].fr ||
                    []).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
              {res.url && (
                <a href={res.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                  {t('confessional_resources_open')}
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="companion-dash-grid">
        <section className="companion-queue card">
          <h2>{t('companion_queue_title')}</h2>
          {loading ? (
            <Loader2 className="spin" size={24} />
          ) : queue.length === 0 ? (
            <p className="text-muted">{t('companion_queue_empty')}</p>
          ) : (
            <ul className="companion-queue-list">
              {queue.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`companion-queue-item ${selectedId === item.id ? 'active' : ''}`}
                    onClick={() => pickRequest(item.id)}
                  >
                    <span className="companion-queue-name">{item.user_display}</span>
                    {item.urgency && <span className="companion-badge urgent">{t('companion_urgent')}</span>}
                    {item.session_crisis?.crisis_level === 'critical' && (
                      <span className="companion-badge crisis">{t('companion_crisis')}</span>
                    )}
                    <span className="companion-queue-meta">
                      {t(`confessional_situation_${item.situation}`)} · {item.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="companion-detail card">
          {!selectedId ? (
            <p className="text-muted">{t('companion_select_case')}</p>
          ) : (
            <>
              <div className="companion-detail-head">
                <h2>{selected?.user_display || '—'}</h2>
                <div className="companion-detail-actions">
                  {selected?.unassigned && (
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleAssign} disabled={sending}>
                      {t('companion_assign')}
                    </button>
                  )}
                  {selected?.mine && (
                    <>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleStatus('in_progress')}
                      >
                        {t('companion_status_in_progress')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleStatus('closed')}
                      >
                        {t('companion_status_closed')}
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={handleEmergency}>
                        <Siren size={14} /> {t('companion_emergency')}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {detail?.request && (
                <dl className="companion-meta-dl">
                  <dt>{t('confessional_companion_availability')}</dt>
                  <dd>{detail.request.availability || '—'}</dd>
                  <dt>{t('confessional_companion_message')}</dt>
                  <dd>{detail.request.message || '—'}</dd>
                </dl>
              )}

              {selected?.mine && team.length > 0 && (
                <div className="companion-transfer">
                  <label htmlFor="companion-transfer-select">{t('companion_transfer_label')}</label>
                  <div className="companion-transfer-row">
                    <select
                      id="companion-transfer-select"
                      className="input"
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                    >
                      <option value="">{t('companion_transfer_pick')}</option>
                      {team.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.id} · {t(`companion_avail_${c.companion_availability || 'offline'}`)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      disabled={!transferTo}
                      onClick={handleTransfer}
                    >
                      {t('companion_transfer_btn')}
                    </button>
                  </div>
                </div>
              )}

              <div className="companion-notes">
                <h3>
                  <StickyNote size={16} /> {t('companion_notes_title')}
                </h3>
                <ul>
                  {(detail?.notes || []).map((n) => (
                    <li key={n.id}>
                      <time>{new Date(n.created_at).toLocaleString()}</time>
                      <p>{n.note_text}</p>
                    </li>
                  ))}
                </ul>
                {selected?.mine && (
                  <form onSubmit={handleNote} className="companion-note-form">
                    <textarea
                      className="input"
                      rows={2}
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder={t('companion_notes_ph')}
                    />
                    <button type="submit" className="btn btn-outline btn-sm">
                      {t('companion_notes_save')}
                    </button>
                  </form>
                )}
              </div>

              {canChat && selected?.mine && (
                <div className="companion-chat">
                  <h3>
                    <MessageCircle size={16} /> {t('companion_chat_title')}
                  </h3>
                  <div className="companion-chat-messages">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`companion-chat-bubble companion-chat-${m.sender_role}`}
                      >
                        {m.content}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleChat} className="companion-chat-form">
                    <input
                      className="input"
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      placeholder={t('companion_chat_ph')}
                      maxLength={2000}
                    />
                    <button type="submit" className="btn btn-primary" disabled={sending}>
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
