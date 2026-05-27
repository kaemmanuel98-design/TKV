import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { pingFriendPresence } from '../lib/friendsApi';

const PRESENCE_INTERVAL_MS = 2 * 60 * 1000;
const TOAST_TTL_MS = 6000;

/**
 * Heartbeat présence + toasts in-app (ami connecté, nouvelle demande).
 */
export function useFriendPresence() {
  const { t } = useTranslation();
  const { user, session } = useAuthStore();
  const profile = useProfileStore((s) => s.profile);
  const location = useLocation();
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((toast) => {
    const id = toast.id || `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, TOAST_TTL_MS);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    if (!user?.id || !session?.access_token) return undefined;

    const appAlertsOn = profile?.notify_friend_online_app !== false;

    const ping = () => {
      pingFriendPresence(session.access_token).catch((err) => {
        console.warn('presence ping', err);
      });
    };

    ping();
    const timer = setInterval(ping, PRESENCE_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') ping();
    };
    document.addEventListener('visibilitychange', onVisible);

    const presenceChannel = supabase
      .channel(`friend-presence-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'friend_presence_events' },
        async (payload) => {
          if (!appAlertsOn) return;
          const onlineId = payload.new?.user_id;
          if (!onlineId || onlineId === user.id) return;

          const { data: prof } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', onlineId)
            .maybeSingle();

          pushToast({
            type: 'online',
            title: t('friends_toast_online_title'),
            message: t('friends_toast_online', {
              name: prof?.name || t('community_author_anonymous'),
            }),
          });
        }
      )
      .subscribe();

    const requestsChannel = supabase
      .channel(`friend-requests-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'friend_requests' },
        async (payload) => {
          if (!appAlertsOn) return;
          const row = payload.new;
          if (!row || row.to_user_id !== user.id || row.status !== 'pending') return;

          const { data: prof } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', row.from_user_id)
            .maybeSingle();

          pushToast({
            type: 'request',
            title: t('friends_toast_request_title'),
            message: t('friends_toast_request', {
              name: prof?.name || t('community_author_anonymous'),
            }),
          });
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel(`friend-messages-in-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          if (!appAlertsOn) return;
          const m = payload.new;
          if (!m?.sender_id) return;
          const onChatPage = location.pathname.startsWith(`/friends/chat/${m.sender_id}`);
          if (onChatPage) return;

          const { data: prof } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', m.sender_id)
            .maybeSingle();

          const preview = (m.content || '').slice(0, 80);
          pushToast({
            type: 'message',
            friendId: m.sender_id,
            title: t('friends_toast_message_title'),
            message: t('friends_toast_message', {
              name: prof?.name || t('community_author_anonymous'),
              preview,
            }),
          });
        }
      )
      .subscribe();

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [
    user?.id,
    session?.access_token,
    profile?.notify_friend_online_app,
    pushToast,
    t,
    location.pathname,
  ]);

  return { toasts, dismissToast };
}
