import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ProfileAvatar from '../components/ProfileAvatar';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { fetchFriendMessages, sendFriendMessage, verifyFriendship } from '../lib/friendChat';
import { isOnline } from '../lib/friends';
import './FriendChat.css';

const FriendChat = () => {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [friendProfile, setFriendProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [allowed, setAllowed] = useState(false);
  const endRef = useRef(null);

  const loadFriend = useCallback(async () => {
    if (!friendId || !user?.id) return;
    const ok = await verifyFriendship(user.id, friendId);
    setAllowed(ok);
    if (!ok) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, last_seen_at')
      .eq('id', friendId)
      .maybeSingle();
    setFriendProfile(data);
  }, [friendId, user?.id]);

  const loadMessages = useCallback(async () => {
    if (!user?.id || !friendId || !allowed) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchFriendMessages(user.id, friendId);
      setMessages(rows);
    } catch (err) {
      console.error(err);
      setError(t('friend_chat_error_load'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, friendId, allowed, t]);

  useEffect(() => {
    loadFriend();
  }, [loadFriend]);

  useEffect(() => {
    if (allowed) loadMessages();
  }, [allowed, loadMessages]);

  useEffect(() => {
    if (!user?.id || !friendId || !allowed) return undefined;

    const channel = supabase
      .channel(`friend-chat-${user.id}-${friendId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const m = payload.new;
          if (!m || m.sender_id !== friendId) return;
          setMessages((prev) => {
            if (prev.some((x) => x.id === m.id)) return prev;
            return [...prev, m];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, friendId, allowed]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !user?.id || !friendId || sending) return;
    setSending(true);
    setError(null);
    try {
      const row = await sendFriendMessage(user.id, friendId, text);
      setMessages((prev) => {
        if (prev.some((m) => m.id === row.id)) return prev;
        return [...prev, row];
      });
      setDraft('');
    } catch (err) {
      console.error(err);
      setError(t('friend_chat_error_send'));
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="container friend-chat-page">
        <p className="text-muted">{t('friends_login_required')}</p>
        <Link to="/auth" className="btn btn-primary">
          {t('profile_login_cta')}
        </Link>
      </div>
    );
  }

  if (!loading && !allowed) {
    return (
      <div className="container friend-chat-page">
        <p className="friend-chat-error">{t('friend_chat_not_friend')}</p>
        <Link to="/friends" className="btn btn-outline">
          {t('friends_nav')}
        </Link>
      </div>
    );
  }

  const friendName = friendProfile?.name || t('community_author_anonymous');
  const online = isOnline(friendProfile?.last_seen_at);

  return (
    <div className="container friend-chat-page animate-fade-in">
      <div className="friend-chat-top">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          {t('friend_chat_back')}
        </button>
        <div className="friend-chat-peer">
          <ProfileAvatar src={friendProfile?.avatar_url} name={friendName} size={44} />
          <div>
            <strong>{friendName}</strong>
            <span className={`friend-chat-status ${online ? 'friend-chat-status--on' : ''}`}>
              {online ? t('friends_status_online') : t('friends_status_offline')}
            </span>
          </div>
        </div>
      </div>

      <PageHeader title={t('friend_chat_title')} subtitle={t('friend_chat_subtitle')} />

      <div className="card friend-chat-panel">
        {loading ? (
          <p className="friend-chat-muted">
            <Loader2 size={18} className="spin" />
            {t('friend_chat_loading')}
          </p>
        ) : (
          <div className="friend-chat-messages">
            {messages.length === 0 && (
              <p className="friend-chat-muted">{t('friend_chat_empty')}</p>
            )}
            {messages.map((msg) => {
              const mine = msg.sender_id === user.id;
              return (
                <div
                  key={msg.id}
                  className={`friend-chat-bubble ${mine ? 'friend-chat-bubble--mine' : ''}`}
                >
                  <p>{msg.content}</p>
                  <time>
                    {new Date(msg.created_at).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        )}

        {error && <p className="friend-chat-error">{error}</p>}

        <form className="friend-chat-form" onSubmit={handleSend}>
          <input
            className="input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('friend_chat_placeholder')}
            maxLength={2000}
            disabled={!allowed}
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !draft.trim()}>
            {sending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FriendChat;
