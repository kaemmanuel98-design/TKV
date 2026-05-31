import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Volume2, ArrowRight, Compass, GraduationCap, Headphones, DoorClosed } from 'lucide-react';
import { getVerseOfDay } from '../data/dailyVerses';
import { useAuthStore } from '../store/useAuthStore';
import { useCourseProgressStore } from '../store/useCourseProgressStore';
import { getNextIncompleteModule } from '../lib/courseStats';
import { useSpeak } from '../hooks/useSpeak';
import MimshackLogo from '../components/MimshackLogo';
import HomeDashboard from '../components/HomeDashboard';
import { LibraryLogo, CommunityLogo, BibleLogo, HeritageLogo } from '../components/SectionLogos';
import './Home.css';

const HOME_MARKS = {
  library: LibraryLogo,
  community: CommunityLogo,
  bible: BibleLogo,
  heritage: HeritageLogo,
};

const pillarPaths = [
  {
    to: '/bible',
    mark: 'bible',
    titleKey: 'bible',
    descKey: 'home_bible_desc',
    pillar: true,
  },
  {
    to: '/heritage',
    mark: 'heritage',
    titleKey: 'heritage',
    descKey: 'home_heritage_desc',
    pillar: true,
  },
];

const startPaths = [
  {
    to: '/library',
    mark: 'library',
    titleKey: 'home_path_library_title',
    descKey: 'home_path_library_desc',
    featured: true,
  },
  {
    to: '/agent',
    mimshack: true,
    titleKey: 'home_path_mimshack_title',
    descKey: 'home_path_mimshack_desc',
  },
  {
    to: '/community',
    mark: 'community',
    titleKey: 'home_path_community_title',
    descKey: 'home_path_community_desc',
  },
  {
    to: '/confessional',
    icon: DoorClosed,
    titleKey: 'home_path_confessional_title',
    descKey: 'home_path_confessional_desc',
  },
  {
    to: '/courses',
    icon: GraduationCap,
    titleKey: 'home_path_courses_title',
    descKey: 'home_path_courses_desc',
  },
  {
    to: '/podcasts',
    icon: Headphones,
    titleKey: 'home_path_podcasts_title',
    descKey: 'home_path_podcasts_desc',
  },
];

const Home = () => {
  const { t, i18n } = useTranslation();
  const verse = getVerseOfDay(i18n.language);
  const { user } = useAuthStore();
  const { speak } = useSpeak();
  const completed = useCourseProgressStore((s) => s.completed);
  const nextModule = getNextIncompleteModule(completed);
  const hasCourseProgress = Object.keys(completed).length > 0;

  const renderPathCard = ({ to, icon: Icon, titleKey, descKey, featured, mimshack, mark, pillar }) => {
    const MarkComponent = mark ? HOME_MARKS[mark] : null;
    const customMark = mimshack || MarkComponent;

    return (
    <Link
      key={to}
      to={to}
      className={`home-path card ${featured ? 'home-path--featured' : ''} ${pillar ? 'home-path--pillar' : ''}`}
    >
      <div
        className={`home-path-icon ${customMark ? 'home-path-icon--mark' : ''}`}
        aria-hidden="true"
      >
        {mimshack ? (
          <MimshackLogo size={44} title="Mim" />
        ) : MarkComponent ? (
          <MarkComponent size={44} title={t(titleKey)} />
        ) : (
          <Icon size={24} strokeWidth={1.5} />
        )}
      </div>
      <h3 className="home-path-title">{t(titleKey)}</h3>
      <p className="home-path-desc">{t(descKey)}</p>
      <span className="home-path-link">
        {t('home_discover')}
        <ArrowRight size={16} aria-hidden="true" />
      </span>
    </Link>
    );
  };

  return (
    <div className="home animate-fade-in">
      <section className="home-hero">
        <div className="home-hero-orb home-hero-orb-1" aria-hidden="true" />
        <div className="home-hero-orb home-hero-orb-2" aria-hidden="true" />

        <div className="container home-hero-inner">
          <p className="home-hero-eyebrow">
            <span className="home-hero-eyebrow-dot" aria-hidden="true" />
            {t('home_hero_eyebrow')}
          </p>

          <h1 className="home-hero-title">{t('home_hero_title')}</h1>
          <p className="home-hero-lead">{t('home_hero_lead')}</p>

          <div className="home-hero-actions">
            <Link to="/library" className="btn btn-primary btn-lg home-hero-cta">
              {t('home_hero_cta_primary')}
              <ArrowRight size={20} aria-hidden="true" />
            </Link>
            <Link to="/agent" className="btn btn-outline btn-lg home-hero-mimshack-btn">
              <MimshackLogo size={22} />
              {t('home_hero_cta_secondary')}
            </Link>
          </div>

          {!user && (
            <p className="home-hero-guest">
              {t('home_hero_guest')}{' '}
              <Link to="/auth" className="home-hero-guest-link">
                {t('layout_login')}
              </Link>
            </p>
          )}
        </div>
      </section>

      {user && <HomeDashboard />}

      {hasCourseProgress && nextModule && (
        <section className="container home-continue-section">
          <Link
            to={`/courses/${nextModule.courseId}/module/${nextModule.moduleIndex}`}
            className="home-continue card"
          >
            <GraduationCap size={22} aria-hidden="true" />
            <div>
              <p className="home-continue-label">{t('home_continue_title')}</p>
              <p className="home-continue-module">
                {t(nextModule.courseTitleKey)} · {t(nextModule.moduleTitleKey)}
              </p>
            </div>
            <span className="home-continue-cta">
              {t('home_continue_cta')}
              <ArrowRight size={16} aria-hidden="true" />
            </span>
          </Link>
        </section>
      )}

      <section className="container home-verse-section" aria-labelledby="home-verse-heading">
        <article className="home-verse card">
          <header className="home-verse-header">
            <p id="home-verse-heading" className="home-verse-label">
              {t('dashboard_verse_label')}
            </p>
            <button
              type="button"
              className="btn btn-ghost btn-sm home-verse-listen"
              onClick={() => speak(verse.text)}
            >
              <Volume2 size={16} aria-hidden="true" />
              {t('listen')}
            </button>
          </header>
          <blockquote className="home-verse-text">&ldquo;{verse.text}&rdquo;</blockquote>
          <cite className="home-verse-ref">{verse.ref}</cite>
        </article>
      </section>

      <section className="container home-paths-section">
        <header className="home-paths-header">
          <p className="home-paths-eyebrow">{t('home_paths_eyebrow')}</p>
          <h2 className="home-paths-title">{t('home_paths_title')}</h2>
          <p className="home-paths-lead">{t('home_paths_lead')}</p>
        </header>

        <div className="home-pillars-grid">{pillarPaths.map(renderPathCard)}</div>
        <div className="home-paths-grid">{startPaths.map(renderPathCard)}</div>
      </section>

      <section className="container home-foot">
        <Link to="/about" className="home-foot-about">
          <Compass size={18} aria-hidden="true" />
          <span>{t('home_about_cta')}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        {user && (
          <p className="home-foot-hint">
            {t('home_profile_hint')}{' '}
            <Link to="/profile">{t('tab_profile')}</Link>
          </p>
        )}
      </section>
    </div>
  );
};

export default Home;
