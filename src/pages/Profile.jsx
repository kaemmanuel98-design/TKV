import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Award,
  Shield,
  LogOut,
  Loader2,
  Flame,
  TrendingUp,
  MessageCircle,
  BookOpen,
  MapPin,
  GraduationCap,
  DoorClosed,
  HeartHandshake,
  Users,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import ProfileAvatar from '../components/ProfileAvatar';
import PaywallModal from '../components/PaywallModal';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { exportUserData, deleteUserAccount, downloadJsonExport } from '../lib/userApi';
import { useProfileStore } from '../store/useProfileStore';
import { useGamificationStore, PROFILE_TYPE_KEY } from '../store/useGamificationStore';
import { useCourseProgressStore } from '../store/useCourseProgressStore';
import { getProfileLocationCache } from '../lib/profileLocation';
import { COURSE_MODULES } from '../data/courseModules';
import { COURSE_IDS } from '../lib/courseStats';
import { CERTIFICATE_COURSES } from '../lib/courseCertificates';
import { fetchUserCertificates } from '../lib/certificateSync';
import { supabase } from '../lib/supabase';
import MimshackLogo from '../components/MimshackLogo';
import { LibraryLogo } from '../components/SectionLogos';
import { useCompanionAccess } from '../hooks/useCompanionAccess';
import './Profile.css';

const badgeDefs = [
  { id: 'first_step', labelKey: 'badge_first_step' },
  { id: 'streak_7', labelKey: 'badge_streak_7' },
  { id: 'reader', labelKey: 'badge_reader' },
  { id: 'community', labelKey: 'badge_community' },
  { id: 'course_nepios', labelKey: 'badge_course_nepios' },
  { id: 'course_neaniskos', labelKey: 'badge_course_neaniskos' },
  { id: 'course_teleios', labelKey: 'badge_course_teleios' },
  { id: 'course_eido', labelKey: 'badge_course_eido' },
];

const profileTypes = ['believer', 'skeptic', 'curious'];

const primaryLinks = [
  { to: '/library', mark: 'library', labelKey: 'tab_library' },
  { to: '/bible', icon: BookOpen, labelKey: 'nav_bible' },
  { to: '/agent', mimshack: true, labelKey: 'tab_agent' },
  { to: '/confessional', icon: DoorClosed, labelKey: 'nav_confessional' },
  { to: '/courses', icon: GraduationCap, labelKey: 'course_page_title' },
  { to: '/cells', icon: MessageCircle, labelKey: 'cells' },
];

const TABS = ['overview', 'account', 'more'];

const Profile = () => {
  const { t } = useTranslation();
  const { user, session, signOut } = useAuthStore();
  const navigate = useNavigate();
  const { profile, fetchProfile, updateProfile, uploadAvatar, getPlanType, canCreateCell } =
    useProfileStore();
  const {
    badges,
    streakCurrent,
    streakBest,
    readingProgress,
    awardBadge,
    incrementCommunityPosts,
    checkInToday,
    hasCheckedInToday,
  } = useGamificationStore();
  const checkedInToday = hasCheckedInToday();
  const courseProgress = useCourseProgressStore((s) => s.progressPercent);
  const courseCompleted = useCourseProgressStore((s) => s.completedCount);
  const [tab, setTab] = useState('overview');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [showOnMap, setShowOnMap] = useState(false);
  const [userType, setUserType] = useState('curious');
  const [saved, setSaved] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);
  const locationHydrated = useRef(false);
  const locationSaveTimer = useRef(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [rgpdBusy, setRgpdBusy] = useState(null);
  const [rgpdNotice, setRgpdNotice] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarNotice, setAvatarNotice] = useState(null);
  const [testimonyDraft, setTestimonyDraft] = useState('');
  const [testimonySubmitting, setTestimonySubmitting] = useState(false);
  const [testimonyNotice, setTestimonyNotice] = useState(null);
  const [myTestimonies, setMyTestimonies] = useState([]);
  const [certificates, setCertificates] = useState([]);

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
    else setUserType(localStorage.getItem(PROFILE_TYPE_KEY) || 'curious');
  }, [user, fetchProfile]);

  useEffect(() => {
    loadMyTestimonies();
  }, [loadMyTestimonies]);

  useEffect(() => {
    if (!user?.id) {
      setCertificates([]);
      return;
    }
    fetchUserCertificates(user.id).then(setCertificates);
  }, [user?.id]);

  useEffect(() => {
    if (profile) {
      const cached = user?.id ? getProfileLocationCache(user.id) : null;
      setCountry(profile.country?.trim() || cached?.country || '');
      setCity(profile.city?.trim() || cached?.city || '');
      setBio(profile.bio || '');
      setShowOnMap(Boolean(profile.show_on_map ?? cached?.show_on_map));
      setUserType(profile.user_type || 'curious');
      locationHydrated.current = true;
    }
  }, [profile, user?.id]);

  useEffect(() => {
    if (!user?.id || !locationHydrated.current) return undefined;
    if (locationSaveTimer.current) clearTimeout(locationSaveTimer.current);
    locationSaveTimer.current = setTimeout(async () => {
      await updateProfile(user.id, {
        country: country.trim(),
        city: city.trim(),
        show_on_map: showOnMap,
      });
      setLocationSaved(true);
      const tId = setTimeout(() => setLocationSaved(false), 2500);
      return () => clearTimeout(tId);
    }, 700);
    return () => {
      if (locationSaveTimer.current) clearTimeout(locationSaveTimer.current);
    };
  }, [country, city, showOnMap, user?.id, updateProfile]);

  const plan = getPlanType();
  const cellHost = Boolean(user && canCreateCell());
  const { isCompanion } = useCompanionAccess();
  const planLabel =
    plan === 'premium' ? t('profile_plan_premium') : t('profile_plan_free');

  const displayName = user?.user_metadata?.name || profile?.name || t('profile_guest');
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const userEmail = user?.email || '';

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  const handleSave = async () => {
    localStorage.setItem(PROFILE_TYPE_KEY, userType);
    if (user) {
      await updateProfile(user.id, {
        country: country.trim(),
        city: city.trim(),
        bio,
        user_type: userType,
        show_on_map: showOnMap,
      });
    }
    setSaved(true);
    setLocationSaved(true);
    setTimeout(() => {
      setSaved(false);
      setLocationSaved(false);
    }, 2000);
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
    } catch {
      setTestimonyNotice({ type: 'err', text: t('community_error') });
    } finally {
      setTestimonySubmitting(false);
    }
  };

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

  const earnedBadges = badgeDefs.filter((b) => badges.includes(b.id)).length;

  return (
    <div className="profile-page animate-fade-in">
      <header className="profile-hero">
        <div className="profile-hero-glow" aria-hidden />
        <div className="profile-hero-inner container">
          <ProfileAvatar
            src={avatarUrl}
            name={displayName}
            size={88}
            editable={Boolean(user)}
            uploading={avatarUploading}
            onPickFile={handleAvatarPick}
          />
          <div className="profile-hero-copy">
            <p className="profile-hero-eyebrow">{t('profile_title')}</p>
            <h1 className="profile-hero-name">{displayName}</h1>
            {userEmail && <p className="profile-hero-email">{userEmail}</p>}
            <div className="profile-hero-meta">
              <span className={`profile-plan-pill profile-plan-pill--${plan}`}>{planLabel}</span>
              {user && (
                <button
                  type="button"
                  className={`profile-checkin-pill ${checkedInToday ? 'is-done' : ''}`}
                  disabled={checkedInToday}
                  onClick={() => checkInToday()}
                >
                  <Flame size={14} aria-hidden />
                  {checkedInToday ? t('dashboard_checkin_done') : t('dashboard_checkin')}
                </button>
              )}
            </div>
            {avatarNotice && (
              <p className={`profile-inline-notice profile-inline-notice--${avatarNotice.type}`}>
                {avatarNotice.text}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="container profile-body">
        <div className="profile-metrics" role="list">
          <article className="profile-metric" role="listitem">
            <Flame size={18} aria-hidden />
            <span className="profile-metric-label">{t('dashboard_streak_label')}</span>
            <strong className="profile-metric-value">
              {streakCurrent === 1
                ? t('dashboard_streak_days', { count: streakCurrent })
                : t('dashboard_streak_days_plural', { count: streakCurrent })}
            </strong>
            {streakBest > 0 && (
              <span className="profile-metric-sub">
                {t('dashboard_streak_record', { count: streakBest })}
              </span>
            )}
          </article>
          <article className="profile-metric" role="listitem">
            <TrendingUp size={18} aria-hidden />
            <span className="profile-metric-label">{t('dashboard_progress_label')}</span>
            <strong className="profile-metric-value">
              {t('dashboard_progress_value', { percent: readingProgress })}
            </strong>
            <div className="profile-progress-bar">
              <div className="profile-progress-fill" style={{ width: `${readingProgress}%` }} />
            </div>
          </article>
          <article className="profile-metric" role="listitem">
            <Award size={18} aria-hidden />
            <span className="profile-metric-label">{t('profile_badges_title')}</span>
            <strong className="profile-metric-value">
              {earnedBadges} / {badgeDefs.length}
            </strong>
          </article>
        </div>

        <nav className="profile-tabs" aria-label={t('profile_title')}>
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`profile-tab ${tab === id ? 'is-active' : ''}`}
              onClick={() => setTab(id)}
            >
              {t(`profile_tab_${id}`)}
            </button>
          ))}
        </nav>

        {tab === 'overview' && (
          <div className="profile-panel" role="tabpanel">
            <section className="profile-panel-block">
              <h2 className="profile-block-title">{t('dashboard_quick_title')}</h2>
              <div className="profile-shortcuts">
                {primaryLinks.map(({ to, icon: Icon, labelKey, mimshack, mark }) => (
                  <Link key={to} to={to} className="profile-shortcut">
                    <span className="profile-shortcut-icon">
                      {mimshack ? (
                        <MimshackLogo size={20} />
                      ) : mark === 'library' ? (
                        <LibraryLogo size={20} />
                      ) : (
                        <Icon size={20} aria-hidden />
                      )}
                    </span>
                    <span className="profile-shortcut-label">{t(labelKey)}</span>
                    <ChevronRight size={16} className="profile-shortcut-chevron" aria-hidden />
                  </Link>
                ))}
              </div>
            </section>

            <section className="profile-panel-block">
              <div className="profile-block-head">
                <h2 className="profile-block-title">{t('profile_courses_title')}</h2>
                <Link to="/courses" className="profile-block-link">
                  {t('profile_view_all')}
                </Link>
              </div>
              <ul className="profile-courses-slim">
                {COURSE_IDS.map((id) => {
                  const course = COURSE_MODULES[id];
                  const pct = courseProgress(id);
                  const done = courseCompleted(id);
                  return (
                    <li key={id}>
                      <Link to={`/courses/${id}`} className="profile-course-slim">
                        <span className="profile-course-slim-name">{t(course.titleKey)}</span>
                        <span className="profile-course-slim-meta">
                          {done}/{course.modules.length}
                        </span>
                        <div className="profile-progress-bar">
                          <div className="profile-progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            {user && certificates.length > 0 && (
              <section className="profile-panel-block">
                <h2 className="profile-block-title">{t('profile_certificates_title')}</h2>
                <ul className="profile-certs-slim">
                  {certificates.map((cert) => (
                    <li key={cert.id}>
                      <Link
                        to={`/courses/${cert.course_slug}/certificate`}
                        className="profile-cert-slim"
                      >
                        <Award size={16} aria-hidden />
                        <span>
                          {t(
                            CERTIFICATE_COURSES[cert.course_slug]?.titleKey || 'course_page_title'
                          )}
                        </span>
                        <code>{cert.certificate_code}</code>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {plan === 'free' && (
              <div className="profile-upsell">
                <Sparkles size={20} aria-hidden />
                <div>
                  <strong>{t('agent_upgrade')}</strong>
                  <p>{t('profile_plan_desc_free')}</p>
                </div>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setPaywallOpen(true)}>
                  {t('agent_upgrade')}
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'account' && (
          <div className="profile-panel" role="tabpanel">
            <section className="profile-panel-block profile-form-block">
              <h2 className="profile-block-title">{t('profile_edit_type')}</h2>
              <p className="profile-block-desc">{t('onboarding_profile_desc')}</p>
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
            </section>

            <section className="profile-panel-block profile-form-block">
              <h2 className="profile-block-title">{t('profile_show_on_map')}</h2>
              <div className="profile-field-grid">
                <div className="profile-field">
                  <label htmlFor="profile-country">{t('profile_country')}</label>
                  <input
                    id="profile-country"
                    className="input"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder={t('profile_country_placeholder')}
                  />
                </div>
                <div className="profile-field">
                  <label htmlFor="profile-city">{t('profile_city')}</label>
                  <input
                    id="profile-city"
                    className="input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t('profile_city_placeholder')}
                  />
                </div>
              </div>
              <label className="profile-map-opt">
                <input
                  type="checkbox"
                  checked={showOnMap}
                  onChange={(e) => setShowOnMap(e.target.checked)}
                  disabled={!user}
                />
                <span>{t('profile_show_on_map')}</span>
              </label>
              {(locationSaved || saved) && (
                <p className="profile-saved-hint" role="status">
                  {t('profile_location_saved')}
                </p>
              )}
            </section>

            <section className="profile-panel-block profile-form-block">
              <h2 className="profile-block-title">{t('profile_bio')}</h2>
              <textarea
                id="profile-bio"
                className="input"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t('profile_bio_placeholder')}
              />
              <button type="button" className="btn btn-primary profile-save-btn" onClick={handleSave}>
                {saved ? t('profile_saved') : t('profile_save')}
              </button>
            </section>

            {!user && (
              <Link to="/auth" className="btn btn-primary btn-lg profile-login-cta">
                {t('profile_login_cta')}
              </Link>
            )}
          </div>
        )}

        {tab === 'more' && (
          <div className="profile-panel" role="tabpanel">
            <div className="profile-action-cards">
              {user && (
                <Link to="/friends" className="profile-action-card">
                  <Users size={20} aria-hidden />
                  <div>
                    <strong>{t('friends_nav')}</strong>
                    <p>{t('friends_subtitle')}</p>
                  </div>
                  <ChevronRight size={18} aria-hidden />
                </Link>
              )}
              {user && (
                <Link to="/map" className="profile-action-card">
                  <MapPin size={20} aria-hidden />
                  <div>
                    <strong>{t('map')}</strong>
                    <p>{t('profile_show_on_map_hint')}</p>
                  </div>
                  <ChevronRight size={18} aria-hidden />
                </Link>
              )}
              {cellHost && (
                <Link to="/cells" className="profile-action-card profile-action-card--accent">
                  <MessageCircle size={20} aria-hidden />
                  <div>
                    <strong>{t('profile_cell_host_title')}</strong>
                    <p>{t('profile_cell_host_desc')}</p>
                  </div>
                  <ChevronRight size={18} aria-hidden />
                </Link>
              )}
              {isCompanion ? (
                <Link to="/companion" className="profile-action-card profile-action-card--accent">
                  <HeartHandshake size={20} aria-hidden />
                  <div>
                    <strong>{t('profile_companion_title')}</strong>
                    <p>{t('profile_companion_desc')}</p>
                  </div>
                  <ChevronRight size={18} aria-hidden />
                </Link>
              ) : (
                user && (
                  <Link to="/companion/apply" className="profile-action-card">
                    <HeartHandshake size={20} aria-hidden />
                    <div>
                      <strong>{t('profile_companion_apply_title')}</strong>
                      <p>{t('profile_companion_apply_desc')}</p>
                    </div>
                    <ChevronRight size={18} aria-hidden />
                  </Link>
                )
              )}
            </div>

            <details className="profile-details">
              <summary>{t('profile_testimony_title')}</summary>
              <div className="profile-details-body">
                <p className="profile-block-desc">{t('profile_testimony_desc')}</p>
                {user ? (
                  <>
                    <form className="profile-testimony-form" onSubmit={handleTestimonySubmit}>
                      <textarea
                        className="input"
                        rows={3}
                        maxLength={2000}
                        value={testimonyDraft}
                        onChange={(e) => setTestimonyDraft(e.target.value)}
                        placeholder={t('profile_testimony_placeholder')}
                      />
                      <button
                        type="submit"
                        className="btn btn-outline btn-sm"
                        disabled={testimonySubmitting || !testimonyDraft.trim()}
                      >
                        {testimonySubmitting ? <Loader2 size={14} className="spin" /> : null}
                        {t('profile_testimony_submit')}
                      </button>
                    </form>
                    {testimonyNotice && (
                      <p className={`profile-inline-notice profile-inline-notice--${testimonyNotice.type}`}>
                        {testimonyNotice.text}
                      </p>
                    )}
                    {myTestimonies.length > 0 && (
                      <ul className="profile-testimony-mini">
                        {myTestimonies.map((item) => (
                          <li key={item.id}>
                            <time>{formatDate(item.created_at)}</time>
                            <p>{item.content}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link to="/auth" className="btn btn-outline btn-sm">
                    {t('profile_testimony_login')}
                  </Link>
                )}
              </div>
            </details>

            <details className="profile-details">
              <summary>
                {t('profile_badges_title')} ({earnedBadges}/{badgeDefs.length})
              </summary>
              <div className="profile-details-body">
                <div className="profile-badges-track">
                  {badgeDefs.map(({ id, labelKey }) => (
                    <span
                      key={id}
                      className={`profile-badge-chip ${badges.includes(id) ? 'earned' : ''}`}
                    >
                      {t(labelKey)}
                    </span>
                  ))}
                </div>
              </div>
            </details>

            <section className="profile-panel-block profile-rgpd-block">
              <h2 className="profile-block-title">
                <Shield size={18} aria-hidden />
                {t('profile_rgpd')}
              </h2>
              <p className="profile-block-desc">{t('profile_rgpd_desc')}</p>
              {user ? (
                <div className="profile-rgpd-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleExportData}
                    disabled={Boolean(rgpdBusy)}
                  >
                    {rgpdBusy === 'export' ? <Loader2 size={14} className="spin" /> : null}
                    {t('profile_rgpd_export')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm profile-rgpd-delete"
                    onClick={handleDeleteAccount}
                    disabled={Boolean(rgpdBusy)}
                  >
                    {t('profile_rgpd_delete')}
                  </button>
                </div>
              ) : (
                <p className="profile-block-desc">{t('profile_rgpd_login')}</p>
              )}
              {rgpdNotice && (
                <p className={`profile-inline-notice profile-inline-notice--${rgpdNotice.type}`}>
                  {rgpdNotice.text}
                </p>
              )}
            </section>

            {user && (
              <button type="button" className="profile-logout-btn" onClick={signOut}>
                <LogOut size={18} aria-hidden />
                {t('profile_logout')}
              </button>
            )}
          </div>
        )}
      </div>

      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
};

export default Profile;
