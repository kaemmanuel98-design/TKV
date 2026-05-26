import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { Send, Video, Loader2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ProfileAvatar from '../components/ProfileAvatar';
import { CELL_ROOMS } from '../data/cellsRooms';
import { fetchJitsiJoin } from '../lib/jitsiApi';
import './Cells.css';

async function enrichMessages(rows, t) {
  if (!rows?.length) return [];
  const userIds = [...new Set(rows.map((m) => m.user_id).filter(Boolean))];
  let profileById = {};
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);
    profileById = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  }

  return rows.map((msg) => {
    const prof = profileById[msg.user_id];
    return {
      ...msg,
      cell_slug: msg.cell_slug || 'global',
      authorName: prof?.name || t('community_author_anonymous'),
      authorAvatar: prof?.avatar_url || null,
    };
  });
}

const Cells = () => {
  const { t, i18n } = useTranslation();
  const { user, session } = useAuthStore();
  const profile = useProfileStore((s) => s.profile);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);

  const defaultSlug =
    CELL_ROOMS.find((r) => r.slug === i18n.language?.split('-')[0])?.slug || 'global';
  const [activeSlug, setActiveSlug] = useState(defaultSlug);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const [embedUrl, setEmbedUrl] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [videoFallback, setVideoFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const activeRoom = CELL_ROOMS.find((r) => r.slug === activeSlug) || CELL_ROOMS[0];

  useEffect(() => {
    if (user?.id) fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('messages')
        .select('id, created_at, content, user_id, cell_slug')
        .order('created_at', { ascending: true })
        .limit(80);

      const { data, error: fetchError } = await query.eq('cell_slug', activeSlug);

      if (fetchError?.message?.includes('cell_slug')) {
        const fallback = await supabase
          .from('messages')
          .select('id, created_at, content, user_id')
          .order('created_at', { ascending: true })
          .limit(80);
        if (fallback.error) throw fallback.error;
        const globalOnly = (fallback.data || []).map((m) => ({ ...m, cell_slug: 'global' }));
        const filtered =
          activeSlug === 'global' ? globalOnly : globalOnly.filter(() => false);
        setMessages(await enrichMessages(filtered, t));
        return;
      }

      if (fetchError) throw fetchError;
      setMessages(await enrichMessages(data || [], t));
    } catch (err) {
      console.error(err);
      setError(t('cells_load_error'));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [activeSlug, t]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`cell-messages-${activeSlug}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `cell_slug=eq.${activeSlug}`,
        },
        async (payload) => {
          const slug = payload.new.cell_slug || 'global';
          if (slug !== activeSlug) return;
          const enriched = await enrichMessages([payload.new], t);
          setMessages((prev) => {
            if (prev.some((m) => m.id === enriched[0]?.id)) return prev;
            return [...prev, enriched[0]];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSlug, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text) return;

    if (!user) {
      setError(t('chat_auth_required'));
      return;
    }

    setSending(true);
    setError(null);
    try {
      const row = { content: text, user_id: user.id, cell_slug: activeSlug };
      const { error: insertError } = await supabase.from('messages').insert([row]);

      if (insertError) {
        if (insertError.message?.includes('cell_slug')) {
          const { error: fallbackErr } = await supabase.from('messages').insert([
            { content: text, user_id: user.id },
          ]);
          if (fallbackErr) throw fallbackErr;
        } else {
          throw insertError;
        }
      }
      setNewMessage('');
    } catch (err) {
      console.error(err);
      setError(`${t('chat_error_send')} ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const closeVideo = () => {
    setShowVideo(false);
    setEmbedUrl(null);
    setVideoError(null);
    setVideoFallback(false);
  };

  const openVideo = async () => {
    if (!user) {
      setVideoError(t('cells_video_login_required'));
      return;
    }
    const token = session?.access_token;
    if (!token) {
      setVideoError(t('cells_video_login_required'));
      return;
    }

    setVideoLoading(true);
    setVideoError(null);
    setVideoFallback(false);
    try {
      const join = await fetchJitsiJoin({ cellSlug: activeSlug, accessToken: token });
      setEmbedUrl(join.embedUrl);
      setVideoFallback(join.mode === 'fallback');
      setShowVideo(true);
    } catch (err) {
      if (err.status === 503) {
        setVideoError(t('cells_video_unavailable'));
      } else {
        setVideoError(t('cells_video_error'));
      }
      setShowVideo(false);
      setEmbedUrl(null);
    } finally {
      setVideoLoading(false);
    }
  };

  const toggleVideo = () => {
    if (showVideo) closeVideo();
    else openVideo();
  };

  return (
    <div className="container animate-fade-in cells-page">
      <PageHeader
        eyebrow={t('cells')}
        title={t('cells_page_title')}
        subtitle={t('cells_page_subtitle')}
        showLogo
        actions={
          <button
            type="button"
            className={`btn btn-sm ${showVideo ? 'btn-outline' : 'btn-primary'}`}
            onClick={toggleVideo}
            disabled={videoLoading}
          >
            {videoLoading ? <Loader2 size={18} className="spin" /> : <Video size={18} />}
            {showVideo ? t('chat_leave_video') : t('cells_video_start')}
          </button>
        }
      />

      <p className="cells-pick-label text-muted">{t('cells_pick_room')}</p>
      <div className="cells-room-picker" role="tablist" aria-label={t('cells_pick_room')}>
        {CELL_ROOMS.map((room) => (
          <button
            key={room.slug}
            type="button"
            role="tab"
            aria-selected={activeSlug === room.slug}
            className={`cells-room-btn ${activeSlug === room.slug ? 'active' : ''}`}
            onClick={() => {
              setActiveSlug(room.slug);
              closeVideo();
            }}
          >
            {t(room.labelKey)}
          </button>
        ))}
      </div>

      {!user && (
        <div className="cells-login-banner">
          <span>{t('cells_members_hint')}</span>
          <Link to="/auth" className="btn btn-primary btn-sm">
            {t('layout_login')}
          </Link>
        </div>
      )}

      {videoError && <p className="cells-error cells-video-error">{videoError}</p>}

      <div className="cells-main">
        <div className="cells-video-wrap flex-1 flex flex-col">
          {videoFallback && showVideo && (
            <p className="cells-video-warn text-muted">{t('cells_video_fallback_warning')}</p>
          )}
          <div className="card cells-video-card flex-1 flex items-stretch">
            {showVideo && embedUrl ? (
              <iframe
                src={embedUrl}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                title={t('chat_join_video')}
                referrerPolicy="no-referrer"
                style={{
                  width: '100%',
                  height: '100%',
                  flex: 1,
                  minHeight: '320px',
                  border: 'none',
                  display: 'block',
                }}
              />
            ) : (
              <div className="cells-video-placeholder text-muted">
                <Video size={48} style={{ opacity: 0.45, margin: '0 auto 1rem' }} />
                <p>{t('chat_video_closed')}</p>
                <p className="mt-2" style={{ fontSize: '0.9375rem' }}>
                  {t('cells_video_room', { room: t(activeRoom.labelKey) })}
                </p>
                <p className="mt-2" style={{ fontSize: '0.875rem' }}>{t('cells_video_in_app')}</p>
                {user ? (
                  <button
                    type="button"
                    className="btn btn-primary cells-video-start-btn"
                    onClick={openVideo}
                    disabled={videoLoading}
                  >
                    {videoLoading ? (
                      <Loader2 size={18} className="spin" />
                    ) : (
                      <Video size={18} />
                    )}
                    {t('cells_video_start')}
                  </button>
                ) : (
                  <Link to="/auth" className="btn btn-primary cells-video-start-btn">
                    {t('cells_video_login_cta')}
                  </Link>
                )}
                <p className="mt-2" style={{ fontSize: '0.8125rem' }}>{t('chat_video_instruction')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card cells-chat-panel">
          <div className="cells-chat-head">
            <h3>{t(activeRoom.labelKey)}</h3>
            <span className="cells-chat-meta">
              {loading ? t('cells_loading') : t('cells_message_count', { count: messages.length })}
            </span>
          </div>

          {error && <p className="cells-error">{error}</p>}

          <div className="cells-chat-feed">
            {loading ? (
              <p className="text-center text-muted">
                <Loader2 size={20} className="spin" />
              </p>
            ) : messages.length === 0 ? (
              <p className="text-center text-muted">{t('chat_no_messages')}</p>
            ) : (
              messages.map((msg) => {
                const isMine = msg.user_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`cells-msg ${isMine ? 'cells-msg--mine' : 'cells-msg--other'}`}
                  >
                    <ProfileAvatar
                      src={isMine ? profile?.avatar_url : msg.authorAvatar}
                      name={isMine ? profile?.name || user?.user_metadata?.name : msg.authorName}
                      size={32}
                    />
                    <div className="cells-msg-body">
                      {!isMine && <span className="cells-msg-author">{msg.authorName}</span>}
                      <p className="cells-msg-text">{msg.content}</p>
                      <time className="cells-msg-time" dateTime={msg.created_at}>
                        {formatTime(msg.created_at)}
                      </time>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="cells-form">
            <input
              type="text"
              className="input"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('chat_placeholder')}
              maxLength={500}
              disabled={sending}
              aria-label={t('chat_placeholder')}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending || !newMessage.trim()}
              aria-label={t('chat_live')}
            >
              {sending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Cells;
