import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Volume2,
  Book,
  Clock,
  Library,
  Users,
  Map,
  ArrowRight,
  Compass,
  Flame,
  Sparkles,
  Radio,
  TrendingUp,
} from 'lucide-react';
import { LogoMark } from '../components/Logo';
import { getVerseOfDay } from '../data/dailyVerses';
import { useGamificationStore } from '../store/useGamificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { useSpeak } from '../hooks/useSpeak';
import './Home.css';

const features = [
  { to: '/bible', icon: Book, titleKey: 'bible', descKey: 'home_bible_desc', large: true },
  { to: '/heritage', icon: Clock, titleKey: 'heritage', descKey: 'home_heritage_desc' },
  { to: '/library', icon: Library, titleKey: 'library', descKey: 'home_library_desc' },
  { to: '/cells', icon: Users, titleKey: 'cells', descKey: 'home_cells_desc' },
  { to: '/map', icon: Map, titleKey: 'map', descKey: 'home_map_desc' },
];

const Home = () => {
  const { t, i18n } = useTranslation();
  const verse = getVerseOfDay(i18n.language);
  const streakCurrent = useGamificationStore((s) => s.streakCurrent);
  const streakBest = useGamificationStore((s) => s.streakBest);
  const readingProgress = useGamificationStore((s) => s.readingProgress);
  const hasCheckedInToday = useGamificationStore((s) => s.hasCheckedInToday);
  const checkInToday = useGamificationStore((s) => s.checkInToday);
  const { user } = useAuthStore();
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const { speak } = useSpeak();

  const handleCheckIn = async () => {
    const didCheckIn = checkInToday();
    if (didCheckIn && user?.id) {
      const { streakCurrent, streakBest, lastCheckIn } = useGamificationStore.getState();
      await updateProfile(user.id, {
        streak_current: streakCurrent,
        streak_best: streakBest,
        last_active_date: lastCheckIn,
      });
    }
  };

  const streakLabel =
    streakCurrent === 1
      ? t('dashboard_streak_days', { count: streakCurrent })
      : t('dashboard_streak_days_plural', { count: streakCurrent });

  return (
    <div className="home animate-fade-in">
      <section className="dashboard container">
        <div className="dashboard-grid">
          <article className="card dashboard-verse">
            <p className="dashboard-label">{t('dashboard_verse_label')}</p>
            <blockquote className="dashboard-verse-text">&ldquo;{verse.text}&rdquo;</blockquote>
            <cite className="dashboard-verse-ref">{verse.ref}</cite>
            <button
              type="button"
              className="btn btn-ghost btn-sm dashboard-verse-listen"
              onClick={() => speak(verse.text)}
            >
              <Volume2 size={16} />
              {t('listen')}
            </button>
          </article>

          <article className="card dashboard-streak">
            <p className="dashboard-label">
              <Flame size={16} />
              {t('dashboard_streak_label')}
            </p>
            <p className="dashboard-streak-value">{streakLabel}</p>
            <p className="dashboard-streak-record">
              {t('dashboard_streak_record', { count: streakBest })}
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleCheckIn}
              disabled={hasCheckedInToday()}
            >
              {hasCheckedInToday() ? t('dashboard_checkin_done') : t('dashboard_checkin')}
            </button>
          </article>

          <article className="card dashboard-progress">
            <p className="dashboard-label">
              <TrendingUp size={16} />
              {t('dashboard_progress_label')}
            </p>
            <div className="dashboard-progress-bar">
              <div className="dashboard-progress-fill" style={{ width: `${readingProgress}%` }} />
            </div>
            <p className="dashboard-progress-value">
              {t('dashboard_progress_value', { percent: readingProgress })}
            </p>
          </article>
        </div>

        <div className="dashboard-banners">
          <div className="card dashboard-live">
            <span className="dashboard-live-badge">{t('dashboard_live_badge')}</span>
            <Radio size={20} />
            <div>
              <h3>{t('dashboard_live_title')}</h3>
              <p>{t('dashboard_live_desc')}</p>
            </div>
          </div>
          <Link to="/agent" className="card dashboard-ia">
            <Sparkles size={22} />
            <div>
              <h3>{t('dashboard_ia_title')}</h3>
              <p>{t('dashboard_ia_desc')}</p>
              <span className="dashboard-ia-cta">
                {t('dashboard_ia_cta')}
                <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        </div>
      </section>

      <section className="hero container hero-compact">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          {t('home_badge')}
        </div>
        <h1 className="hero-title hero-title-compact">{t('welcome')}</h1>
        <p className="hero-subtitle">{t('home_subtitle')}</p>
        <div className="hero-actions">
          <Link to="/library" className="btn btn-primary btn-lg">
            {t('home_cta_explore')}
            <ArrowRight size={20} />
          </Link>
          <Link to="/agent" className="btn btn-outline btn-lg">
            <Sparkles size={20} />
            {t('dashboard_ia_cta')}
          </Link>
        </div>
      </section>

      <section className="section container">
        <header className="section-header">
          <p className="section-eyebrow">{t('dashboard_quick_title')}</p>
          <h2 className="section-title">{t('home_section_title')}</h2>
        </header>

        <div className="bento">
          {features.map(({ to, icon: Icon, titleKey, descKey, large }) => (
            <Link key={to} to={to} className={`bento-card ${large ? 'bento-card-large' : ''}`}>
              <article className="card card-feature">
                <div className="card-feature-icon">
                  <Icon size={large ? 28 : 22} strokeWidth={1.5} />
                </div>
                <h3>{t(titleKey)}</h3>
                <p>{t(descKey)}</p>
                <span className="bento-arrow">
                  {t('home_discover')}
                  <ArrowRight size={16} />
                </span>
              </article>
            </Link>
          ))}
        </div>

        <section className="home-mission" aria-labelledby="home-mission-title">
          <div className="home-mission-panel">
            <div className="home-mission-icon" aria-hidden="true">
              <Compass size={28} strokeWidth={1.5} />
            </div>
            <div className="home-mission-content">
              <p className="section-eyebrow">{t('home_about_eyebrow')}</p>
              <h2 id="home-mission-title" className="home-mission-title">
                {t('home_about_title')}
              </h2>
              <p className="home-mission-desc">{t('home_about_desc')}</p>
            </div>
            <div className="home-mission-action">
              <Link to="/about" className="btn btn-outline home-mission-link">
                {t('home_about_cta')}
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        <div className="cta-band">
          <div className="cta-logo-wrap">
            <LogoMark size={48} />
          </div>
          <h2>{t('home_cta_title')}</h2>
          <p>{t('home_cta_desc')}</p>
          <Link to="/auth" className="btn btn-primary btn-lg">
            {t('layout_login')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
