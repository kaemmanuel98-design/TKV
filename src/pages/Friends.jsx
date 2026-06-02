import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UserPlus,
  Search,
  Loader2,
  Check,
  X,
  MessageCircle,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { FriendsLogo } from '../components/SectionLogos';
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

function FriendRow({ avatar, name, meta, actions, highlight }) {
  return (
    <li className={`friends-row ${highlight ? 'friends-row--highlight' : ''}`}>
      <ProfileAvatar src={avatar} name={name} size={44} />
      <div className="friends-row-body">
        <span className="friends-row-name">{name}</span>
        {meta && <div className="friends-row-meta">{meta}</div>}
      </div>
      {actions && <div className="friends-row-actions">{actions}</div>}
    </li>
  );
}

function StatusPill({ online, onlineLabel, offlineLabel }) {
  return (
    <span className={`friends-status ${online ? 'friends-status--on' : ''}`}>
      <span className="friends-status-dot" aria-hidden />
      {online ? onlineLabel : offlineLabel}
    </span>
  );
}

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
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [savingNotify, setSavingNotify] = useState(false);

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
      setNotifyEmail(profile.notify_friend_online_email === true);
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

  const onlineCount = useMemo(
    () => friends.filter((f) => isOnline(f.otherLastSeen)).length,
    [friends]
  );

  const handleNotifySave = async () => {
    if (!user?.id || savingNotify) return;
    setSavingNotify(true);
    try {
      await updateProfile(user.id, {
        notify_friend_online_email: notifyEmail,
        notify_friend_online_app: notifyApp,
      });
    } finally {
      setSavingNotify(false);
    }
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

  const hero = (
    <header className="friends-hero">
      <div className="friends-hero-glow" aria-hidden />
      <div className="friends-hero-inner container">
        <div className="friends-hero-mark">
          <FriendsLogo size={44} title={t('friends_title')} />
        </div>
        <div className="friends-hero-copy">
          <p className="friends-hero-eyebrow">{t('home_section_eyebrow')}</p>
          <h1 className="friends-hero-title">{t('friends_title')}</h1>
          <p className="friends-hero-subtitle">{t('friends_subtitle')}</p>
        </div>
      </div>
    </header>
  );

  if (!user) {
    return (
      <div className="friends-page animate-fade-in">
        {hero}
        <div className="container friends-body">
          <div className="friends-guest-card">
            <FriendsLogo size={28} title={t('friends_title')} />
            <p>{t('friends_login_required')}</p>
            <Link to="/auth" className="btn btn-primary">
              {t('profile_login_cta')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="friends-page animate-fade-in">
      {hero}

      <div className="container friends-body">
        {!loading && (
          <div className="friends-stats" aria-label={t('friends_title')}>
            <div className="friends-stat">
              <span className="friends-stat-value">{friends.length}</span>
              <span className="friends-stat-label">{t('friends_stat_friends')}</span>
            </div>
            <div className="friends-stat">
              <span className="friends-stat-value friends-stat-value--on">{onlineCount}</span>
              <span className="friends-stat-label">{t('friends_stat_online')}</span>
            </div>
            <div className="friends-stat">
              <span
                className={`friends-stat-value ${incoming.length > 0 ? 'friends-stat-value--pending' : ''}`}
              >
                {incoming.length}
              </span>
              <span className="friends-stat-label">{t('friends_stat_pending')}</span>
            </div>
          </div>
        )}

        <section className="friends-panel friends-panel--search" aria-labelledby="friends-search-heading">
          <h2 id="friends-search-heading" className="friends-panel-title">
            <Search size={18} strokeWidth={1.75} aria-hidden />
            {t('friends_search_title')}
          </h2>
          <div className="friends-search-wrap">
            <Search size={18} className="friends-search-icon" aria-hidden />
            <input
              className="friends-search-input"
              type="search"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder={t('friends_search_placeholder')}
              autoComplete="off"
            />
            {searching && <Loader2 size={18} className="friends-search-spinner spin" aria-hidden />}
          </div>
          {searchQ.trim().length >= 2 && !searching && searchResults.length === 0 && (
            <p className="friends-hint">{t('friends_search_empty')}</p>
          )}
          {searchResults.length > 0 && (
            <ul className="friends-list">
              {searchResults.map((m) => {
                const rel = relationWith(allRequests, user.id, m.id);
                const displayName = m.name || t('community_author_anonymous');
                return (
                  <FriendRow
                    key={m.id}
                    avatar={m.avatar_url}
                    name={displayName}
                    actions={
                      <>
                        {rel === 'none' && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            disabled={busyId === m.id}
                            onClick={() => handleSend(m.id)}
                          >
                            <UserPlus size={15} aria-hidden />
                            {t('friends_add')}
                          </button>
                        )}
                        {rel === 'pending_out' && (
                          <span className="friends-chip">{t('friends_pending_sent')}</span>
                        )}
                        {rel === 'pending_in' && (
                          <span className="friends-chip friends-chip--accent">
                            {t('friends_pending_received')}
                          </span>
                        )}
                        {rel === 'friends' && (
                          <span className="friends-chip friends-chip--ok">{t('friends_already')}</span>
                        )}
                      </>
                    }
                  />
                );
              })}
            </ul>
          )}
        </section>

        {error && (
          <p className="friends-banner friends-banner--error" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="friends-loading">
            <Loader2 size={20} className="spin" aria-hidden />
            {t('friends_loading')}
          </p>
        ) : (
          <>
            {incoming.length > 0 && (
              <section
                className="friends-panel friends-panel--incoming"
                aria-labelledby="friends-incoming-heading"
              >
                <h2 id="friends-incoming-heading" className="friends-panel-title">
                  {t('friends_incoming')}
                  <span className="friends-panel-count">{incoming.length}</span>
                </h2>
                <ul className="friends-list">
                  {incoming.map((r) => (
                    <FriendRow
                      key={r.id}
                      highlight
                      avatar={r.otherAvatar}
                      name={r.otherName}
                      actions={
                        <>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={busyId === r.id}
                            onClick={() => handleRespond(r.id, 'accepted')}
                          >
                            <Check size={15} aria-hidden />
                            {t('friends_accept')}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={busyId === r.id}
                            onClick={() => handleRespond(r.id, 'rejected')}
                          >
                            <X size={15} aria-hidden />
                            {t('friends_decline')}
                          </button>
                        </>
                      }
                    />
                  ))}
                </ul>
              </section>
            )}

            <section className="friends-panel" aria-labelledby="friends-list-heading">
              <h2 id="friends-list-heading" className="friends-panel-title">
                <FriendsLogo size={18} title={t('friends_list_title')} />
                {t('friends_list_title')}
                <span className="friends-panel-count">{friends.length}</span>
              </h2>

              {friends.length === 0 ? (
                <div className="friends-empty">
                  <p className="friends-empty-title">{t('friends_empty_title')}</p>
                  <p className="friends-hint">{t('friends_empty_hint')}</p>
                </div>
              ) : (
                <ul className="friends-list">
                  {friends.map((r) => (
                    <FriendRow
                      key={r.id}
                      avatar={r.otherAvatar}
                      name={r.otherName}
                      meta={
                        <StatusPill
                          online={isOnline(r.otherLastSeen)}
                          onlineLabel={t('friends_status_online')}
                          offlineLabel={t('friends_status_offline')}
                        />
                      }
                      actions={
                        <Link
                          to={`/friends/chat/${r.otherId}`}
                          className="btn btn-primary btn-sm friends-chat-btn"
                        >
                          <MessageCircle size={15} aria-hidden />
                          {t('friend_chat_open')}
                          <ChevronRight size={15} aria-hidden />
                        </Link>
                      }
                    />
                  ))}
                </ul>
              )}
            </section>

            {outgoing.length > 0 && (
              <details className="friends-details">
                <summary className="friends-details-summary">
                  {t('friends_outgoing')}
                  <span className="friends-panel-count">{outgoing.length}</span>
                </summary>
                <ul className="friends-list friends-list--nested">
                  {outgoing.map((r) => (
                    <FriendRow
                      key={r.id}
                      avatar={r.otherAvatar}
                      name={r.otherName}
                      actions={
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={busyId === r.id}
                          onClick={() => handleCancel(r.id)}
                        >
                          {t('friends_cancel_request')}
                        </button>
                      }
                    />
                  ))}
                </ul>
              </details>
            )}

            <details className="friends-details friends-details--prefs">
              <summary className="friends-details-summary">
                <Bell size={16} aria-hidden />
                {t('friends_prefs_section')}
              </summary>
              <div className="friends-prefs">
                <p className="friends-hint">{t('friends_notify_hint')}</p>
                <p className="friends-prefs-label">{t('friends_notify_title')}</p>
                <label className="friends-toggle">
                  <input
                    type="checkbox"
                    checked={notifyApp}
                    onChange={(e) => setNotifyApp(e.target.checked)}
                  />
                  <span>{t('friends_notify_app')}</span>
                </label>
                <label className="friends-toggle">
                  <input
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                  />
                  <span>{t('friends_notify_email')}</span>
                </label>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={savingNotify}
                  onClick={handleNotifySave}
                >
                  {savingNotify ? (
                    <Loader2 size={14} className="spin" aria-hidden />
                  ) : null}
                  {t('profile_save')}
                </button>
              </div>
            </details>
          </>
        )}
      </div>
    </div>
  );
};

export default Friends;
