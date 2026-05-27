import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Award,
  Target,
  Shield,
  LogOut,
  Loader2,
  Flame,
  TrendingUp,
  Video,
  BookOpen,
  Landmark,
  MapPin,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ProfileAvatar from '../components/ProfileAvatar';
import PaywallModal from '../components/PaywallModal';
import SpeechSettings from '../components/SpeechSettings';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { exportUserData, deleteUserAccount, downloadJsonExport } from '../lib/userApi';
import { useProfileStore } from '../store/useProfileStore';
import { useGamificationStore } from '../store/useGamificationStore';
import { PROFILE_TYPE_KEY } from '../store/useGamificationStore';
import { supabase } from '../lib/supabase';
import MimshackLogo from '../components/MimshackLogo';
import { LibraryLogo, ProfileLogo } from '../components/SectionLogos';
import './Profile.css';

const badgeDefs = [
  { id: 'first_step', labelKey: 'badge_first_step' },
  { id: 'streak_7', labelKey: 'badge_streak_7' },
  { id: 'reader', labelKey: 'badge_reader' },
  { id: 'community', labelKey: 'badge_community' },
];

const profileTypes = ['believer', 'skeptic', 'curious'];

const profileQuickLinks = [
  { to: '/bible', icon: BookOpen, labelKey: 'nav_bible' },
  { to: '/heritage', icon: Landmark, labelKey: 'nav_heritage' },
  { to: '/cells', icon: Video, labelKey: 'cells' },
  { to: '/map', icon: MapPin, labelKey: 'map' },
  { to: '/agent', mimshack: true, labelKey: 'tab_agent' },
  { to: '/library', mark: 'library', labelKey: 'tab_library' },
];

const Profile = () => {
  const { t } = useTranslation();
  const { user, session, signOut } = useAuthStore();
  const navigate = useNavigate();
  const { profile, fetchProfile, updateProfile, uploadAvatar, getPlanType } = useProfileStore();
  const {
    badges,
    streakCurrent,
    streakBest,
    readingProgress,
    iaQuestionsCount,
    awardBadge,
    incrementCommunityPosts,
    checkInToday,
    hasCheckedInToday,
  } = useGamificationStore();
  const checkedInToday = hasCheckedInToday();
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [showOnMap, setShowOnMap] = useState(false);
  const [userType, setUserType] = useState('curious');
  const [saved, setSaved] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [rgpdBusy, setRgpdBusy] = useState(null);
  const [rgpdNotice, setRgpdNotice] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarNotice, setAvatarNotice] = useState(null);
  const [testimonyDraft, setTestimonyDraft] = useState('');
  const [testimonySubmitting, setTestimonySubmitting] = useState(false);
  const [testimonyNotice, setTestimonyNotice] = useState(null);
  const [myTestimonies, setMyTestimonies] = useState([]);

  const loadMyTestimonies = useCallback(async () => {
    if (!user?.id) {
      setMyTestimonies([]);
      return;
    }
    const { data, error } = await supabase
      .from('community_posts')
      .select('id, content, created_at')
      .eq('user_id', user.id)
      .eq('post_type', 'testimony')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error) setMyTestimonies(data || []);
  }, [user?.id]);

  useEffect(() => {
    if (user) fetchProfile(user.id);
    else {
      setUserType(localStorage.getItem(PROFILE_TYPE_KEY) || 'curious');
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    loadMyTestimonies();
  }, [loadMyTestimonies]);

  useEffect(() => {
    if (profile) {
      setCountry(profile.country || '');
      setBio(profile.bio || '');
      setShowOnMap(Boolean(profile.show_on_map));
      setUserType(profile.user_type || 'curious');
    }
  }, [profile]);

  const plan = getPlanType();
  const planLabel =
    plan === 'premium_plus'
      ? t('profile_plan_premium_plus')
      : plan === 'premium'
        ? t('profile_plan_premium')
        : t('profile_plan_free');

  const handleSave = async () => {
    localStorage.setItem(PROFILE_TYPE_KEY, userType);
    if (user) {
      await updateProfile(user.id, { country, bio, user_type: userType, show_on_map: showOnMap });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatarPick = async (file) => {
    if (!user?.id) return;
    setAvatarNotice(null);
    setAvatarUploading(true);
    try {
      await uploadAvatar(user.id, file);
      setAvatarNotice({ type: 'ok', text: t('profile_avatar_success') });
    } catch (err) {
      const key = err.i18nKey || (err.message?.startsWith('profile_') ? err.message : null);
      setAvatarNotice({
        type: 'err',
        text: key ? t(key) : err.message || t('auth_error_generic'),
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleTestimonySubmit = async (e) => {
    e.preventDefault();
    const text = testimonyDraft.trim();
    if (!text || !user?.id) return;

    setTestimonySubmitting(true);
    setTestimonyNotice(null);
    try {
      const { error } = await supabase.from('community_posts').insert({
        user_id: user.id,
        content: text,
        post_type: 'testimony',
      });
      if (error) throw error;
      setTestimonyDraft('');
      setTestimonyNotice({ type: 'ok', text: t('profile_testimony_success') });
      awardBadge('community');
      incrementCommunityPosts();
      await loadMyTestimonies();
    } catch (err) {
      console.error(err);
      setTestimonyNotice({ type: 'err', text: t('community_error') });
    } finally {
      setTestimonySubmitting(false);
    }
  };

  const displayName = user?.user_metadata?.name || profile?.name || t('profile_guest');
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  const handleExportData = async () => {
    const token = session?.access_token;
    if (!token) return;
    setRgpdBusy('export');
    setRgpdNotice(null);
    try {
      const data = await exportUserData(token);
      downloadJsonExport(data, `tkv-export-${user.id.slice(0, 8)}.json`);
      setRgpdNotice({ type: 'ok', text: t('profile_rgpd_export_ok') });
    } catch {
      setRgpdNotice({ type: 'err', text: t('profile_rgpd_error') });
    } finally {
      setRgpdBusy(null);
    }
  };

  const handleDeleteAccount = async () => {
    const token = session?.access_token;
    if (!token || !window.confirm(t('profile_rgpd_delete_confirm'))) return;
    setRgpdBusy('delete');
    setRgpdNotice(null);
    try {
      await deleteUserAccount(token);
      await signOut();
      navigate('/');
    } catch {
      setRgpdNotice({ type: 'err', text: t('profile_rgpd_error') });
      setRgpdBusy(null);
    }
  };

  return (
    <div className="container profile-page animate-fade-in">
      <PageHeader
        title={t('profile_title')}
        subtitle={displayName}
        mark={<ProfileLogo size={52} title={t('profile_title')} />}
      />

      <section className="card profile-identity-card">
        <div className="profile-identity-row">
          <ProfileAvatar
            src={avatarUrl}
            name={displayName}
            size={104}
            editable={Boolean(user)}
            uploading={avatarUploading}
            onPickFile={handleAvatarPick}
          />
          <div className="profile-identity-copy">
            <h2 className="profile-identity-name">{displayName}</h2>
            {user ? (
              <>
                <p className="text-muted profile-avatar-hint">{t('profile_avatar_hint')}</p>
                {avatarUploading && (
                  <p className="profile-notice">
                    <Loader2 size={14} className="spin" />
                    {t('profile_avatar_uploading')}
                  </p>
                )}
                {avatarNotice && (
                  <p className={`profile-notice profile-notice--${avatarNotice.type}`}>
                    {avatarNotice.text}
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted profile-avatar-hint">{t('profile_avatar_login')}</p>
            )}
          </div>
        </div>
      </section>

      <section className="card profile-activity-card">
        <h2 className="profile-section-title">{t('profile_activity_title')}</h2>
        <p className="text-muted profile-activity-desc">{t('profile_activity_desc')}</p>

        <div className="profile-activity-stats">
          <div className="profile-activity-stat">
            <div className="profile-activity-stat-head">
              <Flame size={18} aria-hidden="true" />
              <span>{t('dashboard_streak_label')}</span>
            </div>
            <p className="profile-activity-stat-value">
              {streakCurrent === 1
                ? t('dashboard_streak_days', { count: streakCurrent })
                : t('dashboard_streak_days_plural', { count: streakCurrent })}
            </p>
            {streakBest > 0 && (
              <p className="profile-activity-stat-meta">
                {t('dashboard_streak_record', { count: streakBest })}
              </p>
            )}
            <button
              type="button"
              className="btn btn-outline btn-sm profile-activity-checkin"
              disabled={checkedInToday}
              onClick={() => checkInToday()}
            >
              {checkedInToday ? t('dashboard_checkin_done') : t('dashboard_checkin')}
            </button>
          </div>

          <div className="profile-activity-stat">
            <div className="profile-activity-stat-head">
              <TrendingUp size={18} aria-hidden="true" />
              <span>{t('dashboard_progress_label')}</span>
            </div>
            <p className="profile-activity-stat-value">
              {t('dashboard_progress_value', { percent: readingProgress })}
            </p>
            <div className="profile-progress-bar profile-activity-progress">
              <div className="profile-progress-fill" style={{ width: `${readingProgress}%` }} />
            </div>
          </div>
        </div>

        <h3 className="profile-quick-title">{t('dashboard_quick_title')}</h3>
        <div className="profile-quick-grid">
          {profileQuickLinks.map(({ to, icon: Icon, labelKey, mimshack, mark }) => (
            <Link key={to} to={to} className="profile-quick-link">
              {mimshack ? (
                <MimshackLogo size={18} />
              ) : mark === 'library' ? (
                <LibraryLogo size={18} />
              ) : (
                <Icon size={18} aria-hidden="true" />
              )}
              <span>{t(labelKey)}</span>
            </Link>
          ))}
        </div>

        <div className="profile-activity-banners">
          <Link to="/cells" className="profile-activity-banner">
            <span className="profile-activity-banner-badge">{t('dashboard_live_badge')}</span>
            <strong>{t('dashboard_live_title')}</strong>
            <p>{t('dashboard_live_desc')}</p>
          </Link>
          <Link to="/agent" className="profile-activity-banner">
            <strong>{t('dashboard_ia_title')}</strong>
            <p>{t('dashboard_ia_desc')}</p>
          </Link>
        </div>
      </section>

      <section className="card profile-testimony-card">
        <h2 className="profile-section-title">{t('profile_testimony_title')}</h2>
        <p className="text-muted profile-testimony-desc">{t('profile_testimony_desc')}</p>
        {user ? (
          <>
            <form className="profile-testimony-form" onSubmit={handleTestimonySubmit}>
              <textarea
                className="input profile-testimony-textarea"
                rows={4}
                maxLength={2000}
                value={testimonyDraft}
                onChange={(e) => setTestimonyDraft(e.target.value)}
                placeholder={t('profile_testimony_placeholder')}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={testimonySubmitting || !testimonyDraft.trim()}
              >
                {testimonySubmitting ? <Loader2 size={16} className="spin" /> : null}
                {t('profile_testimony_submit')}
              </button>
            </form>
            {testimonyNotice && (
              <p className={`profile-notice profile-notice--${testimonyNotice.type}`}>
                {testimonyNotice.text}
              </p>
            )}
            {myTestimonies.length > 0 ? (
              <div className="profile-testimony-list">
                <h3 className="profile-testimony-list-title">{t('profile_testimony_mine')}</h3>
                <ul>
                  {myTestimonies.map((item) => (
                    <li key={item.id} className="profile-testimony-item">
                      <time>{formatDate(item.created_at)}</time>
                      <p>{item.content}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-muted profile-testimony-empty">{t('profile_testimony_empty')}</p>
            )}
          </>
        ) : (
          <Link to="/auth" className="btn btn-outline btn-sm">
            {t('profile_testimony_login')}
          </Link>
        )}
      </section>

      {user && (
        <section className="card profile-friends-link-card">
          <h2 className="profile-section-title">{t('friends_title')}</h2>
          <p className="text-muted">{t('friends_subtitle')}</p>
          <Link to="/friends" className="btn btn-outline btn-sm">
            {t('friends_nav')}
          </Link>
        </section>
      )}

      <section className="card profile-plan-card">
        <div>
          <h2 className="profile-section-title">{planLabel}</h2>
          <p className="text-muted">
            {plan === 'free' ? t('profile_plan_desc_free') : t('profile_plan_desc_premium')}
          </p>
        </div>
        {plan === 'free' && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setPaywallOpen(true)}>
            {t('agent_upgrade')}
          </button>
        )}
      </section>

      <SpeechSettings />

      <section className="card profile-form">
        <h2 className="profile-section-title">{t('profile_edit_type')}</h2>
        <div className="profile-type-row">
          {profileTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={`profile-type-btn ${userType === type ? 'active' : ''}`}
              onClick={() => setUserType(type)}
            >
              {t(`profile_type_${type}`)}
            </button>
          ))}
        </div>
        <label className="profile-label" htmlFor="profile-country">
          {t('profile_country')}
        </label>
        <input
          id="profile-country"
          className="input"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder={t('profile_country_placeholder')}
        />
        <p className="text-muted profile-hint">{t('profile_country_hint')}</p>
        <label className="profile-map-opt">
          <input
            type="checkbox"
            checked={showOnMap}
            onChange={(e) => setShowOnMap(e.target.checked)}
            disabled={!user}
          />
          <span>{t('profile_show_on_map')}</span>
        </label>
        <p className="text-muted profile-hint">{t('profile_show_on_map_hint')}</p>
        <label className="profile-label" htmlFor="profile-bio">
          {t('profile_bio')}
        </label>
        <textarea
          id="profile-bio"
          className="input"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t('profile_bio_placeholder')}
        />
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          {saved ? t('profile_saved') : t('profile_save')}
        </button>
      </section>

      <section className="profile-section">
        <h2 className="profile-section-title">
          <Award size={20} />
          {t('profile_badges_title')}
        </h2>
        <div className="profile-badges">
          {badgeDefs.map(({ id, labelKey }) => (
            <div
              key={id}
              className={`profile-badge ${badges.includes(id) ? 'earned' : 'locked'}`}
            >
              {t(labelKey)}
            </div>
          ))}
        </div>
      </section>

      <section className="profile-section">
        <h2 className="profile-section-title">
          <Target size={20} />
          {t('profile_goals_title')}
        </h2>
        <ul className="profile-goals">
          <li>
            <span>{t('profile_goal_reading')}</span>
            <div className="profile-progress-bar">
              <div className="profile-progress-fill" style={{ width: `${readingProgress}%` }} />
            </div>
          </li>
          <li>
            <span>{t('profile_goal_ia')}</span>
            <strong>{iaQuestionsCount}</strong>
          </li>
          <li>
            <span>{t('profile_goal_community')}</span>
            <strong>{streakCurrent > 0 ? '✓' : '—'}</strong>
          </li>
        </ul>
      </section>

      <section className="card profile-rgpd">
        <h2 className="profile-section-title">
          <Shield size={20} />
          {t('profile_rgpd')}
        </h2>
        <p className="text-muted">{t('profile_rgpd_desc')}</p>
        {user ? (
          <div className="profile-rgpd-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleExportData}
              disabled={Boolean(rgpdBusy)}
            >
              {rgpdBusy === 'export' ? <Loader2 size={16} className="spin" /> : null}
              {t('profile_rgpd_export')}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm profile-rgpd-delete"
              onClick={handleDeleteAccount}
              disabled={Boolean(rgpdBusy)}
            >
              {rgpdBusy === 'delete' ? <Loader2 size={16} className="spin" /> : null}
              {t('profile_rgpd_delete')}
            </button>
          </div>
        ) : (
          <p className="text-muted profile-hint">{t('profile_rgpd_login')}</p>
        )}
        {rgpdNotice && (
          <p className={`profile-notice profile-notice--${rgpdNotice.type}`}>{rgpdNotice.text}</p>
        )}
      </section>

      <div className="profile-actions-bottom">
        {user ? (
          <button type="button" className="btn btn-outline" onClick={signOut}>
            <LogOut size={18} />
            {t('profile_logout')}
          </button>
        ) : (
          <Link to="/auth" className="btn btn-primary btn-lg">
            {t('profile_login_cta')}
          </Link>
        )}
      </div>

      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
};

export default Profile;
