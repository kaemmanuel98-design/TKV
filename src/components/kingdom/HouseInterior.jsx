import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Heart, MessageCircle, Sofa, Sparkles } from 'lucide-react';
import ProfileAvatar from '../ProfileAvatar';

const ROOMS = [
  { id: 'salon', icon: Sofa, labelKey: 'map_room_salon', descKey: 'map_room_salon_desc', accent: 'salon' },
  { id: 'library', icon: BookOpen, labelKey: 'map_room_library', descKey: 'map_room_library_desc', to: '/library', accent: 'library' },
  { id: 'prayer', icon: MessageCircle, labelKey: 'map_room_prayer', descKey: 'map_room_prayer_desc', to: '/cells', accent: 'prayer' },
  { id: 'wall', icon: Heart, labelKey: 'map_room_wall', descKey: 'map_room_wall_desc', accent: 'wall' },
];

export default function HouseInterior({ member, user, t, onBack, onLeaveHouse }) {
  const [activeRoom, setActiveRoom] = useState('salon');

  const room = ROOMS.find((r) => r.id === activeRoom) || ROOMS[0];

  return (
    <div className="kingdom-house-interior">
      <div className="kingdom-interior-toolbar">
        <button type="button" className="btn btn-ghost btn-sm kingdom-toolbar-btn" onClick={onLeaveHouse}>
          ← {t('map_back_house')}
        </button>
        <button type="button" className="btn btn-ghost btn-sm kingdom-toolbar-btn" onClick={onBack}>
          {t('map_back_map')}
        </button>
      </div>

      <div className="kingdom-interior-layout">
        <nav className="kingdom-rooms-nav kingdom-glass-card" aria-label={t('map_rooms_title')}>
          <h3 className="kingdom-rooms-title">{t('map_rooms_title')}</h3>
          <ul>
            {ROOMS.map((r) => {
              const Icon = r.icon;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    className={`kingdom-room-btn kingdom-room-btn--${r.accent} ${activeRoom === r.id ? 'active' : ''}`}
                    onClick={() => setActiveRoom(r.id)}
                  >
                    <Icon size={18} />
                    {t(r.labelKey)}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={`kingdom-room-view kingdom-glass-card kingdom-room-view--${activeRoom}`}>
          <header className="kingdom-room-head">
            <ProfileAvatar src={member.avatarUrl} name={member.name} size={40} />
            <div>
              <h2>{t(room.labelKey)}</h2>
              <p className="text-muted">{t(room.descKey)}</p>
            </div>
          </header>

          {activeRoom === 'salon' && (
            <div className="kingdom-room-content">
              <p className="kingdom-room-welcome">
                <Sparkles size={18} /> {t('map_room_welcome', { name: member.name })}
              </p>
              {member.bio ? (
                <blockquote className="kingdom-room-bio">{member.bio}</blockquote>
              ) : (
                <p className="text-muted">{t('map_room_no_bio')}</p>
              )}
            </div>
          )}

          {activeRoom === 'library' && (
            <div className="kingdom-room-content">
              <p>{t('map_room_library_body')}</p>
              <Link to="/library" className="btn btn-primary btn-sm">
                <BookOpen size={16} /> {t('tab_library')}
              </Link>
            </div>
          )}

          {activeRoom === 'prayer' && (
            <div className="kingdom-room-content">
              <p>{t('map_room_prayer_body')}</p>
              <Link to="/cells" className="btn btn-primary btn-sm">
                <Video size={16} /> {t('cells')}
              </Link>
            </div>
          )}

          {activeRoom === 'wall' && (
            <div className="kingdom-room-content">
              <p>{t('map_room_wall_body')}</p>
              {member.isFriend && user && member.id !== user.id ? (
                <Link to={`/friends/chat/${member.id}`} className="btn btn-primary btn-sm">
                  <MessageCircle size={16} /> {t('friend_chat_open')}
                </Link>
              ) : (
                <p className="text-muted">{t('map_room_wall_guest')}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
