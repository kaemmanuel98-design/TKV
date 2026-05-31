import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Volume2,
  ChevronRight,
  Compass,
  GraduationCap,
  Headphones,
  DoorClosed,
  Flame,
  BookOpen,
  Users,
} from 'lucide-react';
import { getVerseOfDay } from '../data/dailyVerses';
import { useAuthStore } from '../store/useAuthStore';
import { useCourseProgressStore } from '../store/useCourseProgressStore';
import { useGamificationStore } from '../store/useGamificationStore';
import { getNextIncompleteModule } from '../lib/courseStats';
import { useSpeak } from '../hooks/useSpeak';
import MimshackLogo from '../components/MimshackLogo';
import { LibraryLogo, CommunityLogo, BibleLogo, HeritageLogo } from '../components/SectionLogos';
import './Home.css';

const HOME_MARKS = {
  library: LibraryLogo,
  community: CommunityLogo,
  bible: BibleLogo,
  heritage: HeritageLogo,
};

const primaryTiles = [
  { to: '/library', mark: 'library', titleKey: 'home_path_library_title' },
  { to: '/bible', mark: 'bible', titleKey: 'bible' },
  { to: '/courses', icon: GraduationCap, titleKey: 'home_path_courses_title' },
  { to: '/community', mark: 'community', titleKey: 'home_path_community_title' },
];

const moreLinks = [
  { to: '/agent', mimshack: true, titleKey: 'home_path_mimshack_title' },
  { to: '/heritage', mark: 'heritage', titleKey: 'heritage' },
  { to: '/confessional', icon: DoorClosed, titleKey: 'home_path_confessional_title' },
  { to: '/podcasts', icon: Headphones, titleKey: 'home_path_podcasts_title' },
  { to: '/cells', icon: Users, titleKey: 'community_cells_cta' },
];

const Home = () => {
  const { t, i18n } = useTranslation();
  const verse = getVerseOfDay(i18n.language);
  const { user } = useAuthStore();
  const { speak } = useSpeak();
  const completed = useCourseProgressStore((s) => s.completed);
  const nextModule = getNextIncompleteModule(completed);
  const hasCourseProgress = Object.keys(completed).length > 0;
  const { streakCurrent, checkInToday, hasCheckedInToday } = useGamificationStore();
  const checkedInToday = hasCheckedInToday();

  const renderTile = ({ to, icon: Icon, titleKey, mimshack, mark }) => {
    const Mark = mark ? HOME_MARKS[mark] : null;
    return (
      <Link key={to} to={to} className="home-tile">
        <span className="home-tile-icon" aria-hidden>
          {mimshack ? (
            <MimshackLogo size={32} title="Mim" />
          ) : Mark ? (
            <Mark size={32} title={t(titleKey)} />
          ) : (
            <Icon size={22} strokeWidth={1.5} />
          )}
        </span>
        <span className="home-tile-label">{t(titleKey)}</span>
      </Link>
    );
  };

  const renderMoreLink = ({ to, icon: Icon, titleKey, mimshack, mark }) => {
    const Mark = mark ? HOME_MARKS[mark] : null;
    return (
      <Link key={to} to={to} className="home-more-link">
        {mimshack ? (
          <MimshackLogo size={18} title="Mim" />
        ) : Mark ? (
          <Mark size={18} title={t(titleKey)} />
        ) : (
          <Icon size={16} strokeWidth={1.5} aria-hidden />
        )}
        <span>{t(titleKey)}</span>
      </Link>
    );
  };

  return (
    <div className="home-page animate-fade-in">
      <section className="home-hero">
        <div className="home-hero-glow" aria-hidden />
        <div className="container home-hero-inner">
          <p className="home-hero-eyebrow">{t('home_hero_eyebrow')}</p>
          <h1 className="home-hero-title">{t('home_hero_title')}</h1>
          <p className="home-hero-lead">{t('home_hero_lead')}</p>
          <div className="home-hero-actions">
            <Link to="/library" className="btn btn-primary home-hero-cta">
              {t('home_hero_cta_primary')}
            </Link>
            <Link to="/agent" className="home-hero-secondary">
              <MimshackLogo size={18} />
              {t('home_hero_cta_secondary')}
            </Link>
          </div>
          {!user && (
            <p className="home-hero-guest">
              {t('home_hero_guest')}{' '}
              <Link to="/auth">{t('layout_login')}</Link>
            </p>
          )}
        </div>
      </section>

      <div className="container home-main">
        {user && (
          <div className="home-status">
            {hasCourseProgress && nextModule && (
              <Link
                to={`/courses/${nextModule.courseId}/module/${nextModule.moduleIndex}`}
                className="home-status-resume"
              >
                <BookOpen size={16} aria-hidden />
                <span>{t('home_continue_cta')}</span>
                <ChevronRight size={14} aria-hidden />
              </Link>
            )}
            <div className="home-status-pills">
              <span className="home-status-pill">
                <Flame size={14} aria-hidden />
                {streakCurrent}
              </span>
              <button
                type="button"
                className="home-status-pill home-status-pill--btn"
                disabled={checkedInToday}
                onClick={() => checkInToday()}
              >
                {checkedInToday ? t('dashboard_checkin_done') : t('dashboard_checkin')}
              </button>
              <Link to="/profile" className="home-status-pill home-status-pill--link">
                {t('tab_profile')}
              </Link>
            </div>
          </div>
        )}

        <nav className="home-tiles" aria-label={t('home_primary_title')}>
          {primaryTiles.map(renderTile)}
        </nav>

        <details className="home-more">
          <summary>{t('home_explore_more')}</summary>
          <div className="home-more-grid">{moreLinks.map(renderMoreLink)}</div>
        </details>

        <details className="home-verse-fold">
          <summary>
            <span>{t('dashboard_verse_label')}</span>
            <cite>{verse.ref}</cite>
          </summary>
          <blockquote>&ldquo;{verse.text}&rdquo;</blockquote>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => speak(verse.text)}>
            <Volume2 size={16} aria-hidden />
            {t('listen')}
          </button>
        </details>

        <footer className="home-foot">
          <Link to="/about" className="home-foot-about">
            <Compass size={15} aria-hidden />
            {t('home_about_cta')}
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default Home;
