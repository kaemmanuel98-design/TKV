import React from 'react';
import { Home, DoorOpen, Sparkles } from 'lucide-react';
import ProfileAvatar from '../ProfileAvatar';

export default function HouseExterior({ member, t, onEnter, onBack }) {
  return (
    <div className="kingdom-house-exterior">
      <button type="button" className="btn btn-ghost btn-sm kingdom-toolbar-btn" onClick={onBack}>
        ← {t('map_back')}
      </button>
      <div className="kingdom-house-scene kingdom-house-scene--premium">
        <div className="kingdom-house-sky" />
        <div className="kingdom-house-stars" aria-hidden />
        <div className="kingdom-house-moon" aria-hidden />
        <div className="kingdom-house-ground" aria-hidden />
        <div className="kingdom-house-building">
          <div className="kingdom-house-roof">
            <div className="kingdom-house-roof-shine" />
          </div>
          <div className="kingdom-house-body">
            <div className="kingdom-house-window kingdom-house-window--left" />
            <div className="kingdom-house-window kingdom-house-window--right" />
            <div className="kingdom-house-door-wrap">
              <button type="button" className="kingdom-house-door" onClick={onEnter} aria-label={t('map_enter_house')}>
                <DoorOpen size={28} />
                <span>{t('map_enter_house')}</span>
              </button>
            </div>
          </div>
        </div>
        <div className="kingdom-house-plaque kingdom-glass-card">
          <ProfileAvatar src={member.avatarUrl} name={member.name} size={52} />
          <div>
            <p className="kingdom-house-label">
              <Home size={16} /> {t('map_house_of', { name: member.name })}
            </p>
            <p className="kingdom-house-meta">
              {member.city ? `${member.city}, ` : ''}
              {member.country}
            </p>
          </div>
          <Sparkles className="kingdom-house-sparkle" size={20} aria-hidden />
        </div>
      </div>
    </div>
  );
}
