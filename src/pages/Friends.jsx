import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserPlus, Search, Loader2, Check, X, Users, MessageCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ProfileAvatar from '../components/ProfileAvatar';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import {
  searchMembers,
  fetchMyFriendRequests,
  enrichWithProfiles,
  splitFriendData,
  sendFriendRequest,
  respondFriendRequest,
  cancelFriendRequest,
  isOnline,
  relationWith,
} from '../lib/friends';
import './Friends.css';

const Friends = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { profile, updateProfile } = useProfileStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [friends, setFriends] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [notifyApp, setNotifyApp] = useState(true);

  const reload = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchMyFriendRequests(user.id);
      setAllRequests(rows);
      const { incoming: inc, outgoing: out, friends: fr } = splitFriendData(rows, user.id);
      setIncoming(await enrichWithProfiles(inc, t));
      setOutgoing(await enrichWithProfiles(out, t));
      setFriends(await enrichWithProfiles(fr, t));
    } catch (err) {
      console.error(err);
      setError(t('friends_error_load'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (profile) {
      setNotifyApp(profile.notify_friend_online_app !== false);
    }
  }, [profile]);

  useEffect(() => {
    if (!user?.id || searchQ.trim().length < 2) {
      setSearchResults([]);
      return undefined;
    }
    const id = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await searchMembers(searchQ, user.id);
        setSearchResults(found);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [searchQ, user?.id]);

  const handleNotifySave = async () => {
    if (!user?.id) return;
    await updateProfile(user.id, {
      notify_friend_online_email: false,
      notify_friend_online_app: notifyApp,
    });
  };

  const handleSend = async (toUserId) => {
    if (!user?.id || busyId) return;
    setBusyId(toUserId);
    setError(null);
    try {
      await sendFriendRequest(user.id, toUserId);
      await reload();
    } catch (err) {
      console.error(err);
      if (err?.code === '23505') setError(t('friends_error_already'));
      else setError(t('friends_error_send'));
    } finally {
      setBusyId(null);
    }
  };

  const handleRespond = async (requestId, status) => {
    if (busyId) return;
    setBusyId(requestId);
    try {
      await respondFriendRequest(requestId, status);
      await reload();
    } catch (err) {
      console.error(err);
      setError(t('friends_error_respond'));
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (requestId) => {
    if (busyId) return;
    setBusyId(requestId);
    try {
      await cancelFriendRequest(requestId);
      await reload();
    } catch (err) {
      console.error(err);
      setError(t('friends_error_respond'));
    } finally {
      setBusyId(null);
    }
  };

  if (!user) {
    return (
      <div className="container friends-page">
        <PageHeader title={t('friends_title')} subtitle={t('friends_subtitle')} />
        <div className="card friends-login-prompt">
          <p>{t('friends_login_required')}</p>
          <Link to="/auth" className="btn btn-primary">
            {t('profile_login_cta')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container friends-page animate-fade-in">
      <PageHeader title={t('friends_title')} subtitle={t('friends_subtitle')} />

      <div className="card friends-notify-prefs">
        <h3 className="friends-section-title">{t('friends_notify_title')}</h3>
        <label className="friends-check">
          <input
            type="checkbox"
            checked={notifyApp}
            onChange={(e) => setNotifyApp(e.target.checked)}
          />
          {t('friends_notify_app')}
        </label>
        <label className="friends-check">
          <input
            type="checkbox"
            checked={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.checked)}
          />
          {t('friends_notify_email')}
        </label>
        <button type="button" className="btn btn-outline btn-sm" onClick={handleNotifySave}>
          {t('profile_save')}
        </button>
      </div>

      <div className="card friends-search">
        <h3 className="friends-section-title">
          <Search size={18} />
          {t('friends_search_title')}
        </h3>
        <input
          className="input"
          type="search"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder={t('friends_search_placeholder')}
        />
        {searching && (
          <p className="friends-muted">
            <Loader2 size={14} className="spin" /> {t('friends_searching')}
          </p>
        )}
        {searchQ.trim().length >= 2 && !searching && searchResults.length === 0 && (
          <p className="friends-muted">{t('friends_search_empty')}</p>
        )}
        <ul className="friends-list">
          {searchResults.map((m) => {
            const rel = relationWith(allRequests, user.id, m.id);
            return (
              <li key={m.id} className="friends-list-item">
                <ProfileAvatar src={m.avatar_url} name={m.name} size={40} />
                <span className="friends-list-name">{m.name || t('community_author_anonymous')}</span>
                <div className="friends-list-actions">
                  {rel === 'none' && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      disabled={busyId === m.id}
                      onClick={() => handleSend(m.id)}
                    >
                      <UserPlus size={14} />
                      {t('friends_add')}
                    </button>
                  )}
                  {rel === 'pending_out' && (
                    <span className="friends-badge">{t('friends_pending_sent')}</span>
                  )}
                  {rel === 'pending_in' && (
                    <span className="friends-badge">{t('friends_pending_received')}</span>
                  )}
                  {rel === 'friends' && (
                    <span className="friends-badge friends-badge--ok">{t('friends_already')}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {error && <p className="friends-error">{error}</p>}

      {loading ? (
        <p className="friends-muted">
          <Loader2 size={18} className="spin" /> {t('friends_loading')}
        </p>
      ) : (
        <>
          {incoming.length > 0 && (
            <section className="card friends-section">
              <h3 className="friends-section-title">{t('friends_incoming')}</h3>
              <ul className="friends-list">
                {incoming.map((r) => (
                  <li key={r.id} className="friends-list-item">
                    <ProfileAvatar src={r.otherAvatar} name={r.otherName} size={40} />
                    <span className="friends-list-name">{r.otherName}</span>
                    <div className="friends-list-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={busyId === r.id}
                        onClick={() => handleRespond(r.id, 'accepted')}
                      >
                        <Check size={14} />
                        {t('friends_accept')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={busyId === r.id}
                        onClick={() => handleRespond(r.id, 'rejected')}
                      >
                        <X size={14} />
                        {t('friends_decline')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card friends-section">
            <h3 className="friends-section-title">
              <Users size={18} />
              {t('friends_list_title')} ({friends.length})
            </h3>
            {friends.length === 0 ? (
              <p className="friends-muted">{t('friends_empty')}</p>
            ) : (
              <ul className="friends-list">
                {friends.map((r) => (
                  <li key={r.id} className="friends-list-item">
                    <ProfileAvatar src={r.otherAvatar} name={r.otherName} size={40} />
                    <div className="friends-list-main">
                      <span className="friends-list-name">{r.otherName}</span>
                      <span className="friends-online-label">
                        <span
                          className={`friends-online-dot ${isOnline(r.otherLastSeen) ? 'friends-online-dot--on' : ''}`}
                        />
                        {isOnline(r.otherLastSeen)
                          ? t('friends_status_online')
                          : t('friends_status_offline')}
                      </span>
                    </div>
                    <Link
                      to={`/friends/chat/${r.otherId}`}
                      className="btn btn-primary btn-sm"
                    >
                      <MessageCircle size={14} />
                      {t('friend_chat_open')}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {outgoing.length > 0 && (
            <section className="card friends-section">
              <h3 className="friends-section-title">{t('friends_outgoing')}</h3>
              <ul className="friends-list">
                {outgoing.map((r) => (
                  <li key={r.id} className="friends-list-item">
                    <ProfileAvatar src={r.otherAvatar} name={r.otherName} size={40} />
                    <span className="friends-list-name">{r.otherName}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={busyId === r.id}
                      onClick={() => handleCancel(r.id)}
                    >
                      {t('friends_cancel_request')}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Friends;
