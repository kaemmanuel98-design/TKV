import React from 'react';
import { Phone, Heart, UserRound } from 'lucide-react';
import { getHotlinesForCountry } from '../../data/crisisHotlines';

export default function ConfessionalCrisisScreen({
  t,
  profileCountry,
  onCompanion,
  onDismiss,
  allowDismiss = false,
}) {
  const hotlines = getHotlinesForCountry(profileCountry);

  return (
    <div className="confessional-crisis-screen" role="alertdialog" aria-labelledby="crisis-title">
      <div className="confessional-crisis-card card">
        <Heart size={32} className="confessional-crisis-icon" aria-hidden />
        <h2 id="crisis-title">{t('confessional_crisis_title')}</h2>
        <p className="confessional-crisis-lead">{t('confessional_crisis_lead')}</p>
        <p className="text-muted confessional-crisis-ai">{t('confessional_crisis_ai_message')}</p>

        <p className="confessional-crisis-country">{t(hotlines.countryKey)}</p>
        <ul className="confessional-hotlines">
          {hotlines.lines.map((line) => (
            <li key={line.tel}>
              <a href={`tel:${line.tel}`} className="confessional-hotline-btn">
                <Phone size={18} />
                <span>
                  <strong>{t(line.labelKey)}</strong>
                  <span className="confessional-hotline-tel">{line.tel}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        <button type="button" className="btn btn-primary btn-lg confessional-crisis-companion" onClick={onCompanion}>
          <UserRound size={18} />
          {t('confessional_crisis_companion_cta')}
        </button>

        <p className="text-muted confessional-crisis-legal">{t('confessional_legal_emergency')}</p>

        {allowDismiss && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDismiss}>
            {t('confessional_crisis_back_chat')}
          </button>
        )}
      </div>
    </div>
  );
}
