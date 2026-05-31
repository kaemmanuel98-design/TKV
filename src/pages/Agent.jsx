import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Scale, Loader2, Sparkles, Crown } from 'lucide-react';
import MimshackLogo from '../components/MimshackLogo';
import PaywallModal from '../components/PaywallModal';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { useAgentStore } from '../store/useAgentStore';
import { useGamificationStore } from '../store/useGamificationStore';
import { postAgentChat, postAgentPerspectives } from '../lib/agentApi';
import '../components/MimshackLogo.css';
import './Agent.css';

const Agent = () => {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState('chat');
  const [input, setInput] = useState('');
  const [perspectiveQ, setPerspectiveQ] = useState('');
  const [perspectiveResult, setPerspectiveResult] = useState(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const session = useAuthStore((s) => s.session);
  const profile = useProfileStore((s) => s.profile);
  const getPlanType = useProfileStore((s) => s.getPlanType);
  const isPremium = useProfileStore((s) => s.isPremium);
  const planType = getPlanType();
  const {
    messages,
    sendMessage,
    getLimits,
    resetIfNewDay,
    chatCount,
    canSendChat,
    canAnalyzePerspectives,
    incrementPerspectives,
  } = useAgentStore();
  const incrementIa = useGamificationStore((s) => s.incrementIaQuestions);

  resetIfNewDay();
  const limits = getLimits(planType);
  const lang = i18n.language?.split('-')[0] || 'fr';
  const userType = profile?.user_type || 'curious';
  const token = session?.access_token;

  const chatHistory = messages.map((m) => ({ role: m.role, content: m.content }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, loading, tab]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    if (!isPremium() && !canSendChat(planType)) {
      setPaywallOpen(true);
      return;
    }
    setError(null);
    sendMessage('user', q);
    incrementIa();
    setInput('');
    setLoading(true);

    try {
      const data = await postAgentChat({
        message: q,
        language: lang,
        history: chatHistory,
        accessToken: token,
        userType,
      });
      sendMessage('assistant', data.reply, data.sources);
    } catch (err) {
      if (err.status === 401) {
        setError(t('auth_login_required'));
      } else if (err.status === 402) {
        setPaywallOpen(true);
        sendMessage('assistant', t('agent_quota_exceeded'));
      } else {
        setError(t('agent_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePerspectives = async () => {
    const q = perspectiveQ.trim();
    if (!q || loading) return;
    if (!canAnalyzePerspectives(planType)) {
      setPaywallOpen(true);
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const data = await postAgentPerspectives({
        question: q,
        language: lang,
        accessToken: token,
        userType,
      });
      incrementPerspectives();
      setPerspectiveResult({
        believers: data.believers,
        skeptics: data.skeptics,
        synthesis: data.synthesis,
        sources: data.sources,
      });
    } catch (err) {
      if (err.status === 401) {
        setError(t('auth_login_required'));
      } else if (err.status === 402) {
        setPaywallOpen(true);
      } else {
        setError(t('agent_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const quotaLabel = isPremium()
    ? t('agent_quota_premium')
    : t('agent_quota', { used: chatCount, limit: limits.chat });

  return (
    <div className="agent-page animate-fade-in">
      <header className="agent-hero">
        <div className="agent-hero-glow" aria-hidden />
        <div className="agent-hero-inner container">
          <div className="agent-hero-mark">
            <MimshackLogo size={48} title={t('agent_title')} />
          </div>
          <div className="agent-hero-copy">
            <p className="agent-hero-eyebrow">{t('home_section_eyebrow')}</p>
            <h1 className="agent-hero-title">{t('agent_title')}</h1>
            <p className="agent-hero-subtitle">{t('agent_subtitle')}</p>
            <p className="agent-hero-brain">{t('agent_brain_hint')}</p>
            <span
              className={`agent-quota-chip ${isPremium() ? 'agent-quota-chip--premium' : ''}`}
            >
              {isPremium() ? <Crown size={14} aria-hidden /> : <Sparkles size={14} aria-hidden />}
              {quotaLabel}
            </span>
          </div>
        </div>
      </header>

      <div className="container agent-body">
        <div className="agent-tabs" role="tablist" aria-label={t('agent_title')}>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'chat'}
            className={`agent-tab ${tab === 'chat' ? 'agent-tab--active' : ''}`}
            onClick={() => setTab('chat')}
          >
            <MimshackLogo size={18} />
            {t('agent_tab_chat')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'perspectives'}
            className={`agent-tab ${tab === 'perspectives' ? 'agent-tab--active' : ''}`}
            onClick={() => setTab('perspectives')}
          >
            <Scale size={18} strokeWidth={1.75} aria-hidden />
            {t('agent_tab_perspectives')}
          </button>
        </div>

        {error && (
          <p className="agent-banner agent-banner--error" role="alert">
            {error}
          </p>
        )}

        {tab === 'chat' ? (
          <section className="agent-panel agent-panel--chat" aria-label={t('agent_tab_chat')}>
            <div className="agent-messages">
              {messages.length === 0 && !loading && (
                <div className="agent-welcome">
                  <MimshackLogo size={40} title={t('agent_title')} />
                  <p className="agent-welcome-title">{t('agent_welcome_title')}</p>
                  <p className="agent-welcome-hint">{t('agent_welcome_hint')}</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`agent-msg agent-msg--${msg.role}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="agent-msg-avatar" aria-hidden>
                      <MimshackLogo size={28} />
                    </div>
                  )}
                  <div className="agent-msg-bubble">
                    <p>{msg.content}</p>
                    {msg.sources?.length > 0 && (
                      <div className="agent-sources">
                        <span className="agent-sources-label">{t('agent_sources')}</span>
                        <ul className="agent-sources-list">
                          {msg.sources.map((s, j) => (
                            <li key={j}>
                              {s.title}
                              {s.chapter ? ` — ${s.chapter}` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="agent-msg agent-msg--assistant agent-msg--loading">
                  <div className="agent-msg-avatar" aria-hidden>
                    <MimshackLogo size={28} />
                  </div>
                  <div className="agent-msg-bubble">
                    <Loader2 size={18} className="spin" aria-hidden />
                    <span>{t('agent_loading')}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="agent-messages-anchor" />
            </div>

            <div className="agent-composer">
              <input
                type="text"
                className="agent-composer-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !loading && handleSend()}
                placeholder={t('agent_placeholder')}
                disabled={loading}
                aria-label={t('agent_placeholder')}
              />
              <button
                type="button"
                className="btn btn-primary agent-composer-send"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                aria-label={t('agent_send')}
              >
                <Send size={18} aria-hidden />
              </button>
            </div>
            <p className="agent-disclaimer">{t('agent_disclaimer')}</p>
          </section>
        ) : (
          <section className="agent-panel agent-panel--perspectives" aria-label={t('agent_tab_perspectives')}>
            <div className="agent-panel-head">
              <h2 className="agent-panel-title">{t('perspectives_title')}</h2>
              <p className="agent-panel-desc">{t('perspectives_subtitle')}</p>
            </div>

            {!isPremium() && (
              <div className="agent-premium-strip">
                <p>{t('perspectives_premium_only')}</p>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setPaywallOpen(true)}>
                  {t('agent_upgrade')}
                </button>
              </div>
            )}

            <label className="agent-field-label" htmlFor="perspective-q">
              {t('perspectives_question_label')}
            </label>
            <textarea
              id="perspective-q"
              className="agent-field-textarea"
              rows={3}
              value={perspectiveQ}
              onChange={(e) => setPerspectiveQ(e.target.value)}
              placeholder={t('perspectives_placeholder')}
              disabled={loading}
            />
            <button
              type="button"
              className="btn btn-primary agent-analyze-btn"
              onClick={handlePerspectives}
              disabled={loading || !perspectiveQ.trim()}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" aria-hidden />
                  {t('agent_loading')}
                </>
              ) : (
                <>
                  <Scale size={18} aria-hidden />
                  {t('perspectives_analyze')}
                </>
              )}
            </button>

            {perspectiveResult && (
              <div className="agent-perspective-grid">
                <article className="agent-perspective-card">
                  <h3>{t('perspectives_believers')}</h3>
                  <p>{perspectiveResult.believers}</p>
                </article>
                <article className="agent-perspective-card">
                  <h3>{t('perspectives_skeptics')}</h3>
                  <p>{perspectiveResult.skeptics}</p>
                </article>
                <article className="agent-perspective-card agent-perspective-card--synthesis">
                  <h3>{t('perspectives_synthesis')}</h3>
                  <p>{perspectiveResult.synthesis}</p>
                </article>
              </div>
            )}

            {!isPremium() && (
              <p className="agent-upgrade-hint">
                {t('agent_premium_gate')}{' '}
                <button type="button" className="agent-link-btn" onClick={() => setPaywallOpen(true)}>
                  {t('agent_upgrade')}
                </button>
              </p>
            )}
          </section>
        )}
      </div>

      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
};

export default Agent;
