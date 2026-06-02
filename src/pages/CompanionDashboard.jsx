import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeft,
  Circle,
  Loader2,
  MessageCircle,
  Send,
  Siren,
  StickyNote,
  BookOpen,
} from 'lucide-react';
import { CONFESSIONAL_RESOURCES, CONFESSIONAL_RESOURCE_DETAILS } from '../data/confessionalResources';
import { useAuthStore } from '../store/useAuthStore';
import {
  requestCompanionNotificationPermission,
  useCompanionCrisisAlerts,
} from '../hooks/useCompanionCrisisAlerts';
import {
  assignCompanionRequest,
  cancelCompanionAdminInvite,
  deleteCompanionAdminPost,
  fetchCompanionAdminAudit,
  fetchCompanionAdminInvites,
  fetchCompanionAdminPosts,
  fetchCompanionAdminUsers,
  fetchCompanionChatMessages,
  fetchCompanionCrises,
  fetchCompanionMe,
  fetchCompanionQueue,
  fetchCompanionRequest,
  fetchCompanionApplications,
  searchCompanionAdminUsersByName,
  fetchCompanionTeam,
  patchCompanionApplication,
  patchCompanionAdminPostModeration,
  patchCompanionAdminUserRoles,
  patchCompanionAdminUserRolesByEmail,
  inviteCompanionAdminUser,
  transferCompanionRequest,
  patchCompanionAvailability,
  patchCompanionRequestStatus,
  postCompanionEmergency,
  postCompanionNote,
  sendCompanionChatMessage,
} from '../lib/companionApi';
import './CompanionDashboard.css';

const AVAIL = ['online', 'busy', 'offline'];

export default function CompanionDashboard() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] || 'fr';
  const session = useAuthStore((s) => s.session);
  const token = session?.access_token;

  const [me, setMe] = useState(null);
  const [queue, setQueue] = useState([]);
  const [crises, setCrises] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [adminNotice, setAdminNotice] = useState('');
  const [team, setTeam] = useState([]);
  const [transferTo, setTransferTo] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [applications, setApplications] = useState([]);
  const [adminPosts, setAdminPosts] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminAuditLogs, setAdminAuditLogs] = useState([]);
  const [adminInvites, setAdminInvites] = useState([]);
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [adminAddEmail, setAdminAddEmail] = useState('');
  const [adminAddName, setAdminAddName] = useState('');
  const [adminNameMatches, setAdminNameMatches] = useState([]);
  const [adminNameCountry, setAdminNameCountry] = useState('');
  const [adminNameAvailability, setAdminNameAvailability] = useState('');
  const [adminNameSort, setAdminNameSort] = useState('name_asc');
  const [adminInviteRole, setAdminInviteRole] = useState('companion');
  const [adminPostNote, setAdminPostNote] = useState('');
  const [adminPostFilter, setAdminPostFilter] = useState('pending');
  const [adminBusyKey, setAdminBusyKey] = useState('');
  const chatEndRef = useRef(null);
  const [notifyState, setNotifyState] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  useCompanionCrisisAlerts(token, Boolean(me), t);

  const loadOverview = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const [meRes, queueRes, crisisRes] = await Promise.all([
        fetchCompanionMe(token),
        fetchCompanionQueue(token),
        fetchCompanionCrises(token),
      ]);
      setMe(meRes.me);
      setIsAdmin(Boolean(meRes.isAdmin));
      setIsModerator(Boolean(meRes.isModerator));
      setIsSuperAdmin(Boolean(meRes.isSuperAdmin));
      setQueue(queueRes.queue || []);
      setCrises(crisisRes.crises || []);
      if (meRes.isAdmin || meRes.isModerator || meRes.isSuperAdmin) {
        const tasks = [fetchCompanionAdminAudit(token)];
        if (meRes.isSuperAdmin) tasks.unshift(fetchCompanionAdminPosts(token));
        if (meRes.isAdmin) {
          tasks.push(fetchCompanionApplications(token), fetchCompanionAdminUsers(token), fetchCompanionAdminInvites(token));
        }
        Promise.all(tasks)
          .then((results) => {
            const [first, second, appsRes, usersRes, invitesRes] = results;
            const postsRes = meRes.isSuperAdmin ? first : null;
            const auditRes = meRes.isSuperAdmin ? second : first;
            setAdminPosts(postsRes?.posts || []);
            setAdminAuditLogs(auditRes?.logs || []);
            setApplications(appsRes?.applications || []);
            setAdminUsers(usersRes?.users || []);
            setAdminInvites(invitesRes?.invites || []);
          })
          .catch(() => {
            setApplications([]);
            setAdminPosts([]);
            setAdminUsers([]);
            setAdminAuditLogs([]);
            setAdminInvites([]);
          });
      }
    } catch {
      setError(t('companion_error_load'));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  const loadDetail = useCallback(
    async (id) => {
      if (!token || !id) return;
      try {
        const data = await fetchCompanionRequest(id, token);
        setDetail(data);
        const chat = await fetchCompanionChatMessages(id, token);
        setMessages(chat.messages || []);
      } catch {
        setError(t('companion_error_load'));
      }
    },
    [token, t]
  );

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
    else {
      setDetail(null);
      setMessages([]);
    }
  }, [selectedId, loadDetail]);

  useEffect(() => {
    if (!token || !selectedId) return undefined;
    const timer = setInterval(async () => {
      try {
        const chat = await fetchCompanionChatMessages(selectedId, token);
        setMessages(chat.messages || []);
      } catch {
        /* ignore poll */
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [token, selectedId]);

  useEffect(() => {
    if (!token) return;
    fetchCompanionTeam(token)
      .then((data) => setTeam(data.team || []))
      .catch(() => setTeam([]));
  }, [token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const setAvailability = async (availability) => {
    if (!token) return;
    await patchCompanionAvailability(availability, token);
    setMe((m) => (m ? { ...m, companion_availability: availability } : m));
  };

  const pickRequest = (id) => setSelectedId(id);

  const handleAssign = async () => {
    if (!token || !selectedId) return;
    setSending(true);
    try {
      await assignCompanionRequest(selectedId, token);
      await loadOverview();
      await loadDetail(selectedId);
    } catch {
      setError(t('companion_error_action'));
    } finally {
      setSending(false);
    }
  };

  const handleStatus = async (status) => {
    if (!token || !selectedId) return;
    await patchCompanionRequestStatus(selectedId, status, token);
    await loadOverview();
    await loadDetail(selectedId);
  };

  const handleTransfer = async () => {
    if (!token || !selectedId || !transferTo) return;
    if (!window.confirm(t('companion_transfer_confirm'))) return;
    try {
      await transferCompanionRequest(selectedId, transferTo, token);
      setTransferTo('');
      await loadOverview();
      setSelectedId(null);
    } catch {
      setError(t('companion_error_action'));
    }
  };

  const handleEmergency = async () => {
    if (!token || !selectedId) return;
    if (!window.confirm(t('companion_emergency_confirm'))) return;
    await postCompanionEmergency(selectedId, token);
    await loadOverview();
    await loadDetail(selectedId);
  };

  const handleNote = async (e) => {
    e.preventDefault();
    if (!token || !selectedId || !noteDraft.trim()) return;
    await postCompanionNote(selectedId, noteDraft.trim(), token);
    setNoteDraft('');
    await loadDetail(selectedId);
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!token || !selectedId || !chatDraft.trim()) return;
    setSending(true);
    try {
      const res = await sendCompanionChatMessage(selectedId, chatDraft.trim(), token);
      setMessages((m) => [...m, { ...res.message, sender_role: 'companion', content: chatDraft.trim() }]);
      setChatDraft('');
      if (detail?.request?.status === 'assigned') {
        await patchCompanionRequestStatus(selectedId, 'in_progress', token);
        await loadDetail(selectedId);
      }
    } finally {
      setSending(false);
    }
  };

  const selected = queue.find((q) => q.id === selectedId);
  const canChat = detail?.request?.status === 'assigned' || detail?.request?.status === 'in_progress';

  const refreshAdminData = useCallback(async () => {
    if (!token || (!isAdmin && !isModerator && !isSuperAdmin)) return;
    const tasks = [fetchCompanionAdminAudit(token)];
    if (isSuperAdmin) tasks.unshift(fetchCompanionAdminPosts(token));
    if (isAdmin) {
      tasks.push(
        fetchCompanionApplications(token),
        fetchCompanionAdminUsers(token, 120, adminUserSearch),
        fetchCompanionAdminInvites(token)
      );
    }
    const [first, second, apps, users, invites] = await Promise.all(tasks);
    const posts = isSuperAdmin ? first : null;
    const audit = isSuperAdmin ? second : first;
    setAdminPosts(posts?.posts || []);
    setAdminAuditLogs(audit?.logs || []);
    setApplications(apps?.applications || []);
    setAdminUsers(users?.users || []);
    setAdminInvites(invites?.invites || []);
  }, [token, isAdmin, isModerator, isSuperAdmin, adminUserSearch]);

  const refreshAdminUsers = useCallback(async () => {
    if (!token || !isAdmin) return;
    const users = await fetchCompanionAdminUsers(token, 120, adminUserSearch);
    setAdminUsers(users.users || []);
  }, [token, isAdmin, adminUserSearch]);

  const displayedAdminPosts =
    adminPostFilter === 'all'
      ? adminPosts
      : adminPosts.filter((p) => (p.moderation_status || 'approved') === adminPostFilter);
  const pendingPostsCount = adminPosts.filter(
    (p) => (p.moderation_status || 'approved') === 'pending'
  ).length;

  const handleAdminPostModeration = async (postId, status) => {
    if (!token || !isSuperAdmin || !postId) return;
    const confirmKey = status === 'approved' ? 'companion_admin_approve_post_confirm' : 'companion_admin_reject_post_confirm';
    if (!window.confirm(t(confirmKey))) return;
    setAdminBusyKey(`post:${postId}:${status}`);
    try {
      await patchCompanionAdminPostModeration(postId, status, adminPostNote, token);
      setAdminPostNote('');
      await refreshAdminData();
    } catch {
      setError(t('companion_error_action'));
    } finally {
      setAdminBusyKey('');
    }
  };

  const handleAdminDeletePost = async (postId) => {
    if (!token || !isSuperAdmin || !postId) return;
    if (!window.confirm(t('companion_admin_delete_post_confirm'))) return;
    setAdminBusyKey(`post:${postId}:delete`);
    try {
      await deleteCompanionAdminPost(postId, token);
      await refreshAdminData();
    } catch {
      setError(t('companion_error_action'));
    } finally {
      setAdminBusyKey('');
    }
  };

  const handleAdminToggleRole = async (userId, roleKey, nextValue) => {
    if (!token || !isAdmin || !userId) return;
    const payload =
      roleKey === 'companion'
        ? { isConfessionalCompanion: nextValue }
        : roleKey === 'superadmin'
          ? { isCompanionSuperAdmin: nextValue }
        : roleKey === 'host'
          ? { canHostVisio: nextValue }
          : roleKey === 'moderator'
            ? { isCompanionModerator: nextValue }
            : roleKey === 'admin'
              ? { isCompanionAdmin: nextValue }
          : {};
    if (Object.keys(payload).length === 0) return;
    setAdminBusyKey(`user:${userId}:${roleKey}`);
    try {
      const res = await patchCompanionAdminUserRoles(userId, payload, token);
      setAdminUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...res.user } : u)));
      await refreshAdminData();
    } catch (err) {
      const key = String(err?.message || '').trim();
      if (key === 'forbidden_admin_role') setError(t('companion_admin_super_required'));
      else if (key === 'forbidden_super_admin_role') setError(t('companion_admin_super_required'));
      else if (key === 'last_super_admin_forbidden') setError(t('companion_admin_last_super_forbidden'));
      else if (key === 'self_admin_demotion_forbidden') setError(t('companion_admin_self_demotion_forbidden'));
      else setError(t('companion_error_action'));
    } finally {
      setAdminBusyKey('');
    }
  };

  const handleAdminAddByEmail = async (roleKey) => {
    if (!token || !isAdmin || !adminAddEmail.trim()) return;
    const payload =
      roleKey === 'companion'
        ? { isConfessionalCompanion: true }
        : roleKey === 'moderator'
          ? { isCompanionModerator: true }
          : roleKey === 'admin'
            ? { isCompanionAdmin: true }
            : roleKey === 'superadmin'
              ? { isCompanionSuperAdmin: true }
              : {};
    if (Object.keys(payload).length === 0) return;
    setAdminBusyKey(`add:${roleKey}`);
    try {
      await patchCompanionAdminUserRolesByEmail(adminAddEmail.trim(), payload, token);
      setAdminAddEmail('');
      await refreshAdminData();
    } catch (err) {
      const key = String(err?.message || '').trim();
      if (key === 'user_not_found') setError(t('companion_admin_user_not_found'));
      else if (key === 'invalid_email') setError(t('companion_admin_invalid_email'));
      else if (key === 'forbidden_admin_role' || key === 'forbidden_super_admin_role') {
        setError(t('companion_admin_super_required'));
      } else {
        setError(t('companion_error_action'));
      }
    } finally {
      setAdminBusyKey('');
    }
  };

  const handleAdminInvite = async () => {
    if (!token || !isAdmin || !adminAddEmail.trim()) return;
    setAdminBusyKey('invite');
    try {
      const res = await inviteCompanionAdminUser(adminAddEmail.trim(), adminInviteRole, token);
      setAdminAddEmail('');
      const msg = res?.emailSkipped ? t('companion_admin_invite_skipped') : t('companion_admin_invite_sent');
      setError(null);
      setAdminNotice(msg);
      await refreshAdminData();
    } catch (err) {
      const key = String(err?.message || '').trim();
      if (key === 'user_already_exists') setError(t('companion_admin_user_exists'));
      else if (key === 'invalid_email') setError(t('companion_admin_invalid_email'));
      else if (key === 'forbidden_super_admin_role') setError(t('companion_admin_super_required'));
      else setError(t('companion_error_action'));
      setAdminNotice('');
    } finally {
      setAdminBusyKey('');
    }
  };

  const handleSearchByName = async () => {
    if (!token || !isAdmin || adminAddName.trim().length < 2) return;
    setAdminBusyKey('search-name');
    try {
      const res = await searchCompanionAdminUsersByName(adminAddName.trim(), token, {
        limit: 12,
        country: adminNameCountry,
        availability: adminNameAvailability,
        sort: adminNameSort,
      });
      setAdminNameMatches(res.users || []);
    } catch {
      setError(t('companion_error_action'));
    } finally {
      setAdminBusyKey('');
    }
  };

  const handleAddCompanionByName = async (userId) => {
    if (!token || !isAdmin || !userId) return;
    setAdminBusyKey(`add-by-name:${userId}`);
    try {
      await patchCompanionAdminUserRoles(userId, { isConfessionalCompanion: true }, token);
      setAdminNotice(t('companion_admin_add_by_name_success'));
      setAdminNameMatches((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_confessional_companion: true } : u))
      );
      await refreshAdminData();
    } catch {
      setError(t('companion_error_action'));
    } finally {
      setAdminBusyKey('');
    }
  };

  const handleCancelInvite = async (inviteId) => {
    if (!token || !isAdmin || !inviteId) return;
    if (!window.confirm(t('companion_admin_invite_cancel_confirm'))) return;
    setAdminBusyKey(`invite:${inviteId}`);
    try {
      await cancelCompanionAdminInvite(inviteId, token);
      setAdminInvites((prev) => prev.filter((i) => i.id !== inviteId));
      setAdminNotice(t('companion_admin_invite_cancelled'));
    } catch {
      setError(t('companion_error_action'));
    } finally {
      setAdminBusyKey('');
    }
  };

  return (
    <div className="companion-dash">
      <header className="companion-dash-header">
        <Link to="/" className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> TKV
        </Link>
        <div>
          <h1>{t('companion_dashboard_title')}</h1>
          <p className="text-muted">{t('companion_dashboard_subtitle')}</p>
        </div>
        {notifyState !== 'unsupported' && notifyState !== 'granted' && (
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={async () => {
              const p = await requestCompanionNotificationPermission(token);
              setNotifyState(
                p === 'registered' || p === 'granted' ? 'granted' : p
              );
            }}
          >
            {t('companion_notify_enable')}
          </button>
        )}
        <div className="companion-avail-group">
          {AVAIL.map((a) => (
            <button
              key={a}
              type="button"
              className={`btn btn-sm ${me?.companion_availability === a ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setAvailability(a)}
            >
              <Circle
                size={10}
                className={`companion-avail-dot companion-avail-${a}`}
                fill="currentColor"
              />
              {t(`companion_avail_${a}`)}
            </button>
          ))}
        </div>
      </header>

      {crises.length > 0 && (
        <aside className="companion-crisis-banner card">
          <AlertTriangle size={20} />
          <span>{t('companion_crisis_alert', { count: crises.length })}</span>
        </aside>
      )}

      {isAdmin && applications.length > 0 && (
        <section className="card companion-applications">
          <h2>{t('companion_applications_title')}</h2>
          <ul className="companion-applications-list">
            {applications
              .filter((a) => a.status === 'pending' || a.status === 'reviewing')
              .map((app) => (
                <li key={app.id} className="companion-application-item">
                  <div>
                    <strong>{app.applicant_name || app.applicant_email || '—'}</strong>
                    <span className="text-muted companion-application-meta">
                      {new Date(app.created_at).toLocaleDateString()} · {app.status}
                    </span>
                    <p className="companion-application-motivation">{app.motivation}</p>
                  </div>
                  <div className="companion-application-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={async () => {
                        await patchCompanionApplication(app.id, 'approved', token);
                        const data = await fetchCompanionApplications(token);
                        setApplications(data.applications || []);
                      }}
                    >
                      {t('companion_application_approve')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={async () => {
                        await patchCompanionApplication(app.id, 'rejected', token);
                        const data = await fetchCompanionApplications(token);
                        setApplications(data.applications || []);
                      }}
                    >
                      {t('companion_application_reject')}
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}

      {(isAdmin || isModerator) && (
        <section className="card companion-admin-panel">
          <div className="companion-admin-head">
            <h2>{t('companion_admin_title')}</h2>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={refreshAdminData}
              disabled={Boolean(adminBusyKey)}
            >
              {t('companion_admin_refresh')}
            </button>
          </div>

          <div className="companion-admin-grid">
            {isAdmin && (
              <section className="companion-admin-block">
              <h3>{t('companion_admin_roles_title')}</h3>
              <div className="companion-admin-add-row">
                <input
                  className="input"
                  value={adminAddEmail}
                  onChange={(e) => setAdminAddEmail(e.target.value)}
                  placeholder={t('companion_admin_add_email_ph')}
                />
                <select
                  className="input companion-admin-role-select"
                  value={adminInviteRole}
                  onChange={(e) => setAdminInviteRole(e.target.value)}
                >
                  <option value="companion">{t('companion_admin_add_companion')}</option>
                  <option value="moderator">{t('companion_admin_add_moderator')}</option>
                  <option value="admin">{t('companion_admin_add_admin')}</option>
                  {isSuperAdmin && (
                    <option value="superadmin">{t('companion_admin_add_super_admin')}</option>
                  )}
                </select>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => handleAdminAddByEmail('companion')}
                  disabled={!adminAddEmail.trim() || Boolean(adminBusyKey)}
                >
                  {t('companion_admin_add_companion')}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => handleAdminAddByEmail('moderator')}
                  disabled={!adminAddEmail.trim() || Boolean(adminBusyKey)}
                >
                  {t('companion_admin_add_moderator')}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => handleAdminAddByEmail('admin')}
                  disabled={!adminAddEmail.trim() || !isSuperAdmin || Boolean(adminBusyKey)}
                >
                  {t('companion_admin_add_admin')}
                </button>
                {isSuperAdmin && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => handleAdminAddByEmail('superadmin')}
                    disabled={!adminAddEmail.trim() || Boolean(adminBusyKey)}
                  >
                    {t('companion_admin_add_super_admin')}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleAdminInvite}
                  disabled={
                    !adminAddEmail.trim() ||
                    Boolean(adminBusyKey) ||
                    ((adminInviteRole === 'admin' || adminInviteRole === 'superadmin') && !isSuperAdmin)
                  }
                >
                  {t('companion_admin_invite_cta')}
                </button>
              </div>
              <div className="companion-admin-add-row">
                <input
                  className="input"
                  value={adminAddName}
                  onChange={(e) => setAdminAddName(e.target.value)}
                  placeholder={t('companion_admin_add_name_ph')}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={handleSearchByName}
                  disabled={adminAddName.trim().length < 2 || Boolean(adminBusyKey)}
                >
                  {t('companion_admin_search_by_name')}
                </button>
              </div>
              <div className="companion-admin-add-row">
                <input
                  className="input"
                  value={adminNameCountry}
                  onChange={(e) => setAdminNameCountry(e.target.value)}
                  placeholder={t('companion_admin_filter_country_ph')}
                />
                <select
                  className="input companion-admin-role-select"
                  value={adminNameAvailability}
                  onChange={(e) => setAdminNameAvailability(e.target.value)}
                >
                  <option value="">{t('companion_admin_filter_availability_all')}</option>
                  <option value="online">{t('companion_avail_online')}</option>
                  <option value="busy">{t('companion_avail_busy')}</option>
                  <option value="offline">{t('companion_avail_offline')}</option>
                </select>
                <select
                  className="input companion-admin-role-select"
                  value={adminNameSort}
                  onChange={(e) => setAdminNameSort(e.target.value)}
                >
                  <option value="name_asc">{t('companion_admin_sort_name')}</option>
                  <option value="availability">{t('companion_admin_sort_availability')}</option>
                  <option value="recent">{t('companion_admin_sort_recent')}</option>
                </select>
              </div>
              {adminNameMatches.length > 0 && (
                <ul className="companion-admin-name-match-list">
                  {adminNameMatches.map((u) => (
                    <li key={u.id} className="companion-admin-name-match-item">
                      <div>
                        <strong>{u.name || u.email || u.id}</strong>
                        <span className="text-muted companion-admin-post-meta">{u.email || u.id}</span>
                      </div>
                      <button
                        type="button"
                        className={`btn btn-sm ${u.is_confessional_companion ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleAddCompanionByName(u.id)}
                        disabled={u.is_confessional_companion || adminBusyKey === `add-by-name:${u.id}`}
                      >
                        {u.is_confessional_companion
                          ? t('companion_admin_already_companion')
                          : t('companion_admin_add_companion')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="companion-admin-search">
                <input
                  className="input"
                  value={adminUserSearch}
                  onChange={(e) => setAdminUserSearch(e.target.value)}
                  placeholder={t('companion_admin_search_users_ph')}
                />
                <button type="button" className="btn btn-sm btn-outline" onClick={refreshAdminUsers}>
                  {t('companion_admin_search')}
                </button>
              </div>
              {adminUsers.length === 0 ? (
                <p className="text-muted">{t('companion_admin_empty_users')}</p>
              ) : (
                <ul className="companion-admin-user-list">
                  {adminUsers.map((u) => (
                    <li key={u.id} className="companion-admin-user-item">
                      <div className="companion-admin-user-meta">
                        <strong>{u.name || u.email || u.id}</strong>
                        <span className="text-muted">{u.email || u.id}</span>
                      </div>
                      <div className="companion-admin-user-actions">
                        {isSuperAdmin && (
                          <button
                            type="button"
                            className={`btn btn-sm ${u.is_companion_super_admin ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() =>
                              handleAdminToggleRole(u.id, 'superadmin', !u.is_companion_super_admin)
                            }
                            disabled={adminBusyKey === `user:${u.id}:superadmin`}
                          >
                            {u.is_companion_super_admin
                              ? t('companion_admin_role_super_admin_on')
                              : t('companion_admin_role_super_admin_off')}
                          </button>
                        )}
                        <button
                          type="button"
                          className={`btn btn-sm ${u.is_companion_admin ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => handleAdminToggleRole(u.id, 'admin', !u.is_companion_admin)}
                          disabled={
                            adminBusyKey === `user:${u.id}:admin` ||
                            !isSuperAdmin ||
                            (u.id === me?.id && u.is_companion_admin)
                          }
                          title={
                            !isSuperAdmin
                              ? t('companion_admin_super_required')
                              : u.id === me?.id && u.is_companion_admin
                                ? t('companion_admin_self_demotion_forbidden')
                                : undefined
                          }
                        >
                          {u.is_companion_admin
                            ? t('companion_admin_role_admin_on')
                            : t('companion_admin_role_admin_off')}
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${u.is_companion_moderator ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() =>
                            handleAdminToggleRole(u.id, 'moderator', !u.is_companion_moderator)
                          }
                          disabled={adminBusyKey === `user:${u.id}:moderator`}
                        >
                          {u.is_companion_moderator
                            ? t('companion_admin_role_moderator_on')
                            : t('companion_admin_role_moderator_off')}
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${u.is_confessional_companion ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() =>
                            handleAdminToggleRole(u.id, 'companion', !u.is_confessional_companion)
                          }
                          disabled={adminBusyKey === `user:${u.id}:companion`}
                        >
                          {u.is_confessional_companion
                            ? t('companion_admin_role_companion_on')
                            : t('companion_admin_role_companion_off')}
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${u.can_host_visio ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => handleAdminToggleRole(u.id, 'host', !u.can_host_visio)}
                          disabled={adminBusyKey === `user:${u.id}:host`}
                        >
                          {u.can_host_visio
                            ? t('companion_admin_role_host_on')
                            : t('companion_admin_role_host_off')}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              </section>
            )}

            {isAdmin && (
              <section className="companion-admin-block">
                <h3>{t('companion_admin_invites_title')}</h3>
                {adminInvites.length === 0 ? (
                  <p className="text-muted">{t('companion_admin_invites_empty')}</p>
                ) : (
                  <ul className="companion-admin-invite-list">
                    {adminInvites.map((invite) => (
                      <li key={invite.id} className="companion-admin-invite-item">
                        <div>
                          <strong>{invite.invitee_email}</strong>
                          <span className="text-muted companion-admin-post-meta">
                            {invite.invited_role} · {new Date(invite.created_at).toLocaleString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => handleCancelInvite(invite.id)}
                          disabled={adminBusyKey === `invite:${invite.id}`}
                        >
                          {t('companion_admin_invite_cancel')}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {isSuperAdmin && (
            <section className="companion-admin-block">
              <h3>{t('companion_admin_posts_title')}</h3>
              <div className="companion-admin-post-filters">
                <button
                  type="button"
                  className={`btn btn-sm ${adminPostFilter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setAdminPostFilter('pending')}
                >
                  {t('companion_admin_filter_pending')} ({pendingPostsCount})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${adminPostFilter === 'approved' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setAdminPostFilter('approved')}
                >
                  {t('companion_admin_filter_approved')}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${adminPostFilter === 'rejected' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setAdminPostFilter('rejected')}
                >
                  {t('companion_admin_filter_rejected')}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${adminPostFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setAdminPostFilter('all')}
                >
                  {t('companion_admin_filter_all')}
                </button>
              </div>
              <textarea
                className="input companion-admin-note"
                rows={2}
                value={adminPostNote}
                onChange={(e) => setAdminPostNote(e.target.value)}
                placeholder={t('companion_admin_post_note_ph')}
              />
              {displayedAdminPosts.length === 0 ? (
                <p className="text-muted">{t('companion_admin_empty_posts')}</p>
              ) : (
                <ul className="companion-admin-post-list">
                  {displayedAdminPosts.map((post) => (
                    <li key={post.id} className="companion-admin-post-item">
                      <div>
                        <strong>{post.author_name || post.author_email || '—'}</strong>
                        <span className="text-muted companion-admin-post-meta">
                          {new Date(post.created_at).toLocaleString()} · {post.moderation_status || 'approved'}
                        </span>
                        <p className="companion-admin-post-content">{post.content}</p>
                      </div>
                      <div className="companion-admin-post-actions">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => handleAdminPostModeration(post.id, 'approved')}
                          disabled={adminBusyKey === `post:${post.id}:approved`}
                        >
                          {t('companion_admin_approve_post')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleAdminPostModeration(post.id, 'rejected')}
                          disabled={adminBusyKey === `post:${post.id}:rejected`}
                        >
                          {t('companion_admin_reject_post')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleAdminDeletePost(post.id)}
                          disabled={adminBusyKey === `post:${post.id}:delete`}
                        >
                          {t('companion_admin_delete_post')}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            )}

            <section className="companion-admin-block">
              <h3>{t('companion_admin_audit_title')}</h3>
              {adminAuditLogs.length === 0 ? (
                <p className="text-muted">{t('companion_admin_empty_audit')}</p>
              ) : (
                <ul className="companion-admin-audit-list">
                  {adminAuditLogs.map((log) => (
                    <li key={log.id} className="companion-admin-audit-item">
                      <strong>{log.action_type}</strong>
                      <span className="text-muted">
                        {log.admin_email || log.admin_user_id || '—'} · {new Date(log.created_at).toLocaleString()}
                      </span>
                      <p className="companion-admin-audit-target">
                        {log.target_type} · {log.target_id}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </section>
      )}

      {error && <p className="confessional-error">{error}</p>}
      {adminNotice && <p className="community-notice community-notice--ok">{adminNotice}</p>}

      <section className="companion-resources card">
        <h2>
          <BookOpen size={20} /> {t('confessional_resources_title')}
        </h2>
        <ul className="companion-resources-list">
          {CONFESSIONAL_RESOURCES.map((res) => (
            <li key={res.id}>
              <strong>{t(res.titleKey)}</strong>
              <p className="text-muted">{t(res.descKey)}</p>
              {CONFESSIONAL_RESOURCE_DETAILS[res.id] && (
                <ul>
                  {(CONFESSIONAL_RESOURCE_DETAILS[res.id][lang] ||
                    CONFESSIONAL_RESOURCE_DETAILS[res.id].fr ||
                    []).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
              {res.url && (
                <a href={res.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                  {t('confessional_resources_open')}
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="companion-dash-grid">
        <section className="companion-queue card">
          <h2>{t('companion_queue_title')}</h2>
          {loading ? (
            <Loader2 className="spin" size={24} />
          ) : queue.length === 0 ? (
            <p className="text-muted">{t('companion_queue_empty')}</p>
          ) : (
            <ul className="companion-queue-list">
              {queue.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`companion-queue-item ${selectedId === item.id ? 'active' : ''}`}
                    onClick={() => pickRequest(item.id)}
                  >
                    <span className="companion-queue-name">{item.user_display}</span>
                    {item.urgency && <span className="companion-badge urgent">{t('companion_urgent')}</span>}
                    {item.session_crisis?.crisis_level === 'critical' && (
                      <span className="companion-badge crisis">{t('companion_crisis')}</span>
                    )}
                    <span className="companion-queue-meta">
                      {t(`confessional_situation_${item.situation}`)} · {item.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="companion-detail card">
          {!selectedId ? (
            <p className="text-muted">{t('companion_select_case')}</p>
          ) : (
            <>
              <div className="companion-detail-head">
                <h2>{selected?.user_display || '—'}</h2>
                <div className="companion-detail-actions">
                  {selected?.unassigned && (
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleAssign} disabled={sending}>
                      {t('companion_assign')}
                    </button>
                  )}
                  {selected?.mine && (
                    <>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleStatus('in_progress')}
                      >
                        {t('companion_status_in_progress')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleStatus('closed')}
                      >
                        {t('companion_status_closed')}
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={handleEmergency}>
                        <Siren size={14} /> {t('companion_emergency')}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {detail?.request && (
                <dl className="companion-meta-dl">
                  <dt>{t('confessional_companion_availability')}</dt>
                  <dd>{detail.request.availability || '—'}</dd>
                  <dt>{t('confessional_companion_message')}</dt>
                  <dd>{detail.request.message || '—'}</dd>
                </dl>
              )}

              {selected?.mine && team.length > 0 && (
                <div className="companion-transfer">
                  <label htmlFor="companion-transfer-select">{t('companion_transfer_label')}</label>
                  <div className="companion-transfer-row">
                    <select
                      id="companion-transfer-select"
                      className="input"
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                    >
                      <option value="">{t('companion_transfer_pick')}</option>
                      {team.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.id} · {t(`companion_avail_${c.companion_availability || 'offline'}`)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      disabled={!transferTo}
                      onClick={handleTransfer}
                    >
                      {t('companion_transfer_btn')}
                    </button>
                  </div>
                </div>
              )}

              <div className="companion-notes">
                <h3>
                  <StickyNote size={16} /> {t('companion_notes_title')}
                </h3>
                <ul>
                  {(detail?.notes || []).map((n) => (
                    <li key={n.id}>
                      <time>{new Date(n.created_at).toLocaleString()}</time>
                      <p>{n.note_text}</p>
                    </li>
                  ))}
                </ul>
                {selected?.mine && (
                  <form onSubmit={handleNote} className="companion-note-form">
                    <textarea
                      className="input"
                      rows={2}
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder={t('companion_notes_ph')}
                    />
                    <button type="submit" className="btn btn-outline btn-sm">
                      {t('companion_notes_save')}
                    </button>
                  </form>
                )}
              </div>

              {canChat && selected?.mine && (
                <div className="companion-chat">
                  <h3>
                    <MessageCircle size={16} /> {t('companion_chat_title')}
                  </h3>
                  <div className="companion-chat-messages">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`companion-chat-bubble companion-chat-${m.sender_role}`}
                      >
                        {m.content}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleChat} className="companion-chat-form">
                    <input
                      className="input"
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      placeholder={t('companion_chat_ph')}
                      maxLength={2000}
                    />
                    <button type="submit" className="btn btn-primary" disabled={sending}>
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
