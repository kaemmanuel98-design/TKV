import React, { useState } from 'react';
import {
  AlertTriangle,
  MessageCircle,
  HeartHandshake,
  UserRound,
  BookOpen,
  CloudRain,
  Flame,
  Users,
  Activity,
  Heart,
  Sparkles,
  HelpCircle,
  UsersRound,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { SITUATION_LEVEL } from '../../lib/confessionalCrisis';
import ConfessionalPortalMeta from './ConfessionalPortalMeta';

const SITUATIONS = [
  { id: 'depression', icon: CloudRain },
  { id: 'grief', icon: Heart },
  { id: 'family', icon: Users },
  { id: 'illness', icon: Activity },
  { id: 'addiction', icon: Flame },
  { id: 'spiritual', icon: Sparkles },
  { id: 'other', icon: HelpCircle },
  { id: 'suicidal', icon: AlertTriangle },
];

const ACTIONS = [
  { id: 'chat', icon: MessageCircle, labelKey: 'confessional_action_chat_short', primary: true },
  { id: 'prayer', icon: HeartHandshake, labelKey: 'confessional_action_prayer_short' },
  { id: 'companion', icon: UserRound, labelKey: 'confessional_action_companion_short' },
  { id: 'journal', icon: BookOpen, labelKey: 'confessional_action_journal_short' },
  { id: 'support', icon: UsersRound, labelKey: 'confessional_action_support_short' },
];

export default function ConfessionalPortal({
  t,
  lang,
  accessToken,
  onStart,
  onResumeChat,
  onOpenCompanionChat,
}) {
  const [situation, setSituation] = useState('other');
  const [consent, setConsent] = useState(false);

  return (
    <div className="confessional-portal-wrap">
      <header className="confessional-hero">
        <div className="confessional-hero-glow" aria-hidden />
        <p className="confessional-hero-eyebrow">{t('confessional_eyebrow')}</p>
        <h1 className="confessional-hero-title">{t('confessional_title')}</h1>
        <p className="confessional-hero-lead">{t('confessional_subtitle_short')}</p>
        <p className="confessional-hero-trust">
          <Lock size={14} aria-hidden />
          {t('confessional_privacy_short')}
        </p>
      </header>

      <ConfessionalPortalMeta
        t={t}
        lang={lang}
        situation={situation}
        accessToken={accessToken}
        onResumeChat={onResumeChat}
        onOpenCompanionChat={onOpenCompanionChat}
      />

      <section className="confessional-panel card">
        <p className="confessional-panel-label">{t('confessional_situation_title_short')}</p>
        <div className="confessional-situation-grid" role="radiogroup" aria-label={t('confessional_situation_title')}>
          {SITUATIONS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={situation === id}
              className={`confessional-situation-chip ${situation === id ? 'active' : ''} ${
                SITUATION_LEVEL[id] === 'critical' ? 'critical' : ''
              }`}
              onClick={() => setSituation(id)}
            >
              <Icon size={17} strokeWidth={1.75} aria-hidden />
              <span>{t(`confessional_situation_${id}`)}</span>
            </button>
          ))}
        </div>

        {situation === 'suicidal' && (
          <p className="confessional-suicidal-hint" role="note">
            {t('confessional_suicidal_hint_short')}
          </p>
        )}

        <label className="confessional-consent">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>{t('confessional_consent_short')}</span>
        </label>

        <div className={`confessional-actions ${consent ? '' : 'confessional-actions--locked'}`}>
          {ACTIONS.map(({ id, icon: Icon, labelKey, primary }) => (
            <button
              key={id}
              type="button"
              className={`confessional-action-tile ${primary ? 'confessional-action-tile--primary' : ''}`}
              disabled={!consent}
              onClick={() => onStart(id, situation)}
            >
              <span className="confessional-action-icon" aria-hidden>
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <span className="confessional-action-label">{t(labelKey)}</span>
            </button>
          ))}
        </div>

        <details className="confessional-legal-details">
          <summary>
            {t('confessional_legal_toggle')}
            <ChevronDown size={16} className="confessional-legal-chevron" aria-hidden />
          </summary>
          <ul>
            <li>{t('confessional_legal_not_medical')}</li>
            <li>{t('confessional_legal_emergency')}</li>
          </ul>
        </details>
      </section>
    </div>
  );
}
