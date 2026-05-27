import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, UserPlus, Wifi, MessageCircle } from 'lucide-react';
import { useFriendPresence } from '../hooks/useFriendPresence';
import './FriendPresenceToasts.css';

const FriendPresenceToasts = () => {
  const { t } = useTranslation();
  const { toasts, dismissToast } = useFriendPresence();

  if (!toasts.length) return null;

  return (
    <div className="friend-toasts" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`friend-toast friend-toast--${toast.type || 'online'}`}>
          <div className="friend-toast-icon">
            {toast.type === 'request' ? (
              <UserPlus size={18} />
            ) : toast.type === 'message' ? (
              <MessageCircle size={18} />
            ) : (
              <Wifi size={18} />
            )}
          </div>
          <div className="friend-toast-body">
            <strong>{toast.title}</strong>
            <p>{toast.message}</p>
            <Link
              to={
                toast.type === 'message' && toast.friendId
                  ? `/friends/chat/${toast.friendId}`
                  : '/friends'
              }
              className="friend-toast-link"
            >
              {toast.type === 'message'
                ? t('friends_toast_cta_chat')
                : toast.type === 'request'
                  ? t('friends_toast_cta_requests')
                  : t('friends_toast_cta_friends')}
            </Link>
          </div>
          <button
            type="button"
            className="friend-toast-close"
            onClick={() => dismissToast(toast.id)}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default FriendPresenceToasts;
