import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Scale, Loader2 } from 'lucide-react';
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

  return (
    <div className="container agent-page animate-fade-in">
      <header className="agent-header-brand">
        <MimshackLogo size={56} showWordmark title="Mim" />
        <div className="agent-header-brand-copy">
          <h1>{t('agent_title')}</h1>
          <p>{t('agent_subtitle')}</p>
        </div>
      </header>

      <div className="agent-tabs">
        <button
          type="button"
          className={`agent-tab ${tab === 'chat' ? 'active' : ''}`}
          onClick={() => setTab('chat')}
        >
          <MimshackLogo size={18} />
          {t('agent_tab_chat')}
        </button>
        <button
          type="button"
          className={`agent-tab ${tab === 'perspectives' ? 'active' : ''}`}
          onClick={() => setTab('perspectives')}
        >
          <Scale size={18} />
          {t('agent_tab_perspectives')}
        </button>
      </div>

      <p className="agent-quota">
        {isPremium()
          ? t('agent_quota_premium')
          : t('agent_quota', { used: chatCount, limit: limits.chat })}
      </p>

      {error && <p className="agent-error">{error}</p>}

      {tab === 'chat' ? (
        <div className="agent-chat card">
          <div className="agent-messages">
            {messages.length === 0 && (
              <p className="agent-empty text-muted">{t('agent_placeholder')}</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`agent-msg agent-msg-${msg.role}`}>
                <p>{msg.content}</p>
                {msg.sources?.length > 0 && (
                  <div className="agent-sources">
                    <span className="agent-sources-label">{t('agent_sources')}</span>
                    {msg.sources.map((s, j) => (
                      <cite key={j}>
                        {s.title}
                        {s.chapter ? ` — ${s.chapter}` : ''}
                      </cite>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="agent-msg agent-msg-assistant agent-loading">
                <Loader2 size={18} className="spin" />
                {t('agent_loading')}
              </div>
            )}
          </div>
          <div className="agent-input-row">
            <input
              type="text"
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
              placeholder={t('agent_placeholder')}
              disabled={loading}
              aria-label={t('agent_placeholder')}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSend}
              disabled={loading}
              aria-label={t('agent_send')}
            >
              <Send size={18} />
            </button>
          </div>
          <p className="agent-disclaimer">{t('agent_disclaimer')}</p>
        </div>
      ) : (
        <div className="agent-perspectives">
          {!isPremium() && (
            <div className="agent-premium-banner card">
              <p>{t('perspectives_premium_only')}</p>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setPaywallOpen(true)}>
                {t('agent_upgrade')}
              </button>
            </div>
          )}
          <label className="agent-label" htmlFor="perspective-q">
            {t('perspectives_question_label')}
          </label>
          <textarea
            id="perspective-q"
            className="input agent-textarea"
            rows={3}
            value={perspectiveQ}
            onChange={(e) => setPerspectiveQ(e.target.value)}
            placeholder={t('perspectives_placeholder')}
            disabled={loading}
          />
          <button type="button" className="btn btn-primary" onClick={handlePerspectives} disabled={loading}>
            {loading ? t('agent_loading') : t('perspectives_analyze')}
          </button>
          {perspectiveResult && (
            <div className="agent-perspective-results">
              <article className="card">
                <h3>{t('perspectives_believers')}</h3>
                <p>{perspectiveResult.believers}</p>
              </article>
              <article className="card">
                <h3>{t('perspectives_skeptics')}</h3>
                <p>{perspectiveResult.skeptics}</p>
              </article>
              <article className="card agent-synthesis">
                <h3>{t('perspectives_synthesis')}</h3>
                <p>{perspectiveResult.synthesis}</p>
              </article>
            </div>
          )}
        </div>
      )}

      {!isPremium() && (
        <p className="agent-upgrade-hint">
          {t('agent_premium_gate')}{' '}
          <button type="button" className="link-btn" onClick={() => setPaywallOpen(true)}>
            {t('agent_upgrade')}
          </button>
        </p>
      )}

      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
};

export default Agent;
