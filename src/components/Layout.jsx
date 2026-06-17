import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Heart,
  Globe,
  Moon,
  Sun,
  ArrowLeft,
  Headphones,
  DoorClosed,
  HeartHandshake,
  Info,
  ChevronDown,
  Wrench,
  X,
} from 'lucide-react';
import {
  BibleNavIcon,
  HeritageNavIcon,
  CoursesNavIcon,
  CommunityNavIcon,
  CellsNavIcon,
  FriendsNavIcon,
  MapNavIcon,
} from './SectionLogos';
import { MimshackNavIcon } from './MimshackLogo';
import { HomeNavIcon, LibraryNavIcon, ProfileNavIcon } from './SectionLogos';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { LogoMark } from './Logo';
import ProfileAvatar from './ProfileAvatar';
import OnboardingGate from './OnboardingGate';
import { useCompanionAccess } from '../hooks/useCompanionAccess';
import { useTheme } from '../hooks/useTheme';
import { prefetchAllNavRoutes, prefetchRoute, scheduleIdleTask } from '../lib/prefetchRoutes';
import './Layout.css';

const FriendPresenceToasts = lazy(() => import('./FriendPresenceToasts'));
const PaymentModal = lazy(() => import('./PaymentModal'));

/** Navigation principale simplifiée (inspiration lecture-first). */
const mainNavItems = [
  { to: '/', icon: HomeNavIcon, labelKey: 'tab_home', end: true },
  { to: '/library', icon: LibraryNavIcon, labelKey: 'tab_library' },
  { to: '/courses', icon: CoursesNavIcon, labelKey: 'course_page_title' },
  { to: '/profile', icon: ProfileNavIcon, labelKey: 'tab_profile' },
];

const mobileNavItems = [
  { ...mainNavItems[0], mobileLabelKey: 'nav_mobile_home' },
  { ...mainNavItems[1], mobileLabelKey: 'nav_mobile_library' },
  { ...mainNavItems[2], mobileLabelKey: 'course_page_title' },
];

const getToolGroups = (isCompanion) => [
  {
    labelKey: 'nav_tools_group_faith',
    items: [
      { to: '/bible', icon: BibleNavIcon, labelKey: 'nav_bible' },
      { to: '/heritage', icon: HeritageNavIcon, labelKey: 'nav_heritage' },
      { to: '/confessional', icon: DoorClosed, labelKey: 'nav_confessional' },
      { to: '/podcasts', icon: Headphones, labelKey: 'podcast_page_title' },
    ],
  },
  {
    labelKey: 'nav_tools_group_connect',
    items: [
      { to: '/agent', icon: MimshackNavIcon, labelKey: 'tab_agent' },
      ...(isCompanion
        ? [{ to: '/companion', icon: HeartHandshake, labelKey: 'nav_companion' }]
        : []),
      { to: '/community', icon: CommunityNavIcon, labelKey: 'tab_community' },
      { to: '/friends', icon: FriendsNavIcon, labelKey: 'friends_nav' },
      { to: '/cells', icon: CellsNavIcon, labelKey: 'footer_link_cells' },
    ],
  },
  {
    labelKey: 'nav_tools_group_explore',
    items: [{ to: '/map', icon: MapNavIcon, labelKey: 'map' }],
  },
];

const footerLinks = [
  { to: '/about', icon: Info, labelKey: 'footer_link_about' },
  { to: '/bible', icon: BibleNavIcon, labelKey: 'footer_link_bible' },
  { to: '/heritage', icon: HeritageNavIcon, labelKey: 'footer_link_heritage' },
  { to: '/courses', icon: CoursesNavIcon, labelKey: 'footer_link_courses' },
  { to: '/podcasts', icon: Headphones, labelKey: 'footer_link_podcasts' },
  { to: '/cells', icon: CellsNavIcon, labelKey: 'footer_link_cells' },
];

const Layout = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const profile = useProfileStore((s) => s.profile);
  const { isCompanion } = useCompanionAccess();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  const toolGroups = getToolGroups(isCompanion);

  const isToolActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const isOnToolRoute =
    location.pathname === '/about' ||
    toolGroups.some((group) => group.items.some((item) => isToolActive(item.to)));

  const closeTools = () => {
    setToolsOpen(false);
    setMobileToolsOpen(false);
  };

  useEffect(() => {
    closeTools();
  }, [location.pathname]);

  useEffect(() => {
    if (!toolsOpen) return undefined;
    const onPointerDown = (e) => {
      if (!e.target.closest('.nav-tools-wrap')) setToolsOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setToolsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [toolsOpen]);

  useEffect(() => {
    if (!mobileToolsOpen) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileToolsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [mobileToolsOpen]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (mq.matches) setMobileToolsOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    scheduleIdleTask(prefetchAllNavRoutes);
  }, []);

  useEffect(() => {
    if (user?.id) fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const canGoBack = location.pathname !== '/';
  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const warmRoute = (path) => () => prefetchRoute(path);

  const renderToolsPanel = (variant) => (
    <div className={`nav-tools-panel nav-tools-panel--${variant}`}>
      {toolGroups.map(({ labelKey, items }) => (
        <section key={labelKey} className="nav-tools-group">
          <h3 className="nav-tools-group-label">{t(labelKey)}</h3>
          <div
            className={`nav-tools-grid${items.length === 1 ? ' nav-tools-grid--single' : ''}`}
          >
            {items.map(({ to, icon: Icon, labelKey: itemLabelKey }) => (
              <Link
                key={to}
                to={to}
                className={`nav-tools-tile ${isToolActive(to) ? 'is-active' : ''}`}
                onClick={closeTools}
                onMouseEnter={warmRoute(to)}
                onFocus={warmRoute(to)}
                onTouchStart={warmRoute(to)}
              >
                <span className="nav-tools-tile-icon" aria-hidden>
                  <Icon size={variant === 'mobile' ? 20 : 18} strokeWidth={1.75} />
                </span>
                <span className="nav-tools-tile-label">{t(itemLabelKey)}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <Link to="/about" className="nav-tools-about" onClick={closeTools}>
        <Info size={16} strokeWidth={1.75} aria-hidden />
        {t('layout_about')}
      </Link>
    </div>
  );

  return (
    <div className={`layout-container${mobileToolsOpen ? ' tools-mobile-open' : ''}`}>
      {user ? (
        <Suspense fallback={null}>
          <FriendPresenceToasts />
        </Suspense>
      ) : null}
      <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
        <Link to="/" className="logo">
          <div className="logo-mark">
            <LogoMark size={32} title="TKV — The Kingdom's Voice" />
          </div>
          <div className="logo-text">
            <strong>TKV</strong>
            <span>The Kingdom&apos;s Voice</span>
          </div>
        </Link>

        {canGoBack && (
          <button type="button" className="btn btn-ghost btn-sm header-back-btn" onClick={handleBack}>
            <ArrowLeft size={16} />
            <span className="hide-mobile">{t('layout_back')}</span>
          </button>
        )}

        <nav className="nav-desktop" aria-label="Navigation principale">
          {mainNavItems.map(({ to, icon: Icon, labelKey, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={t(labelKey)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onMouseEnter={warmRoute(to)}
              onFocus={warmRoute(to)}
              onTouchStart={warmRoute(to)}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span className="nav-link-label">{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <div className="nav-tools-wrap">
            <button
              type="button"
              className={`btn btn-ghost btn-sm nav-tools-btn hide-mobile ${toolsOpen ? 'is-open' : ''}`}
              onClick={() => setToolsOpen((o) => !o)}
              aria-expanded={toolsOpen}
              aria-haspopup="true"
            >
              {t('nav_tools')}
              <ChevronDown size={14} className="nav-tools-chevron" aria-hidden />
            </button>
            {toolsOpen && (
              <div className="nav-tools-dropdown" role="menu" aria-label={t('nav_tools')}>
                <div className="nav-tools-dropdown-head">
                  <span className="nav-tools-dropdown-title">{t('nav_tools')}</span>
                </div>
                {renderToolsPanel('desktop')}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsPaymentOpen(true)}
            className="btn btn-primary btn-sm"
          >
            <Heart size={16} strokeWidth={2} />
            <span className="hide-mobile">{t('layout_support')}</span>
          </button>

          <div className="lang-switcher">
            <Globe size={16} color="var(--text-tertiary)" className="hide-mobile-icon" />
            <select
              onChange={changeLanguage}
              value={i18n.language?.split('-')[0] || 'fr'}
              className="lang-select"
              aria-label="Langue"
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
              <option value="es">ES</option>
              <option value="nl">NL</option>
              <option value="pt">PT</option>
              <option value="ar">AR</option>
            </select>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-ghost btn-sm theme-toggle-btn"
            aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span className="hide-mobile">{theme === 'dark' ? 'Clair' : 'Sombre'}</span>
          </button>

          {user ? (
            <Link to="/profile" className="header-profile-link" title={t('tab_profile')}>
              <ProfileAvatar
                src={profile?.avatar_url || user.user_metadata?.avatar_url}
                name={profile?.name || user.user_metadata?.name}
                size={36}
              />
            </Link>
          ) : (
            <Link to="/auth" className="btn btn-outline btn-sm">
              <ProfileNavIcon size={16} />
              <span className="hide-mobile">{t('layout_login')}</span>
            </Link>
          )}
        </div>
      </header>

      <main className="main-content">
        <OnboardingGate>
          <Outlet />
        </OnboardingGate>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo-row">
            <LogoMark size={52} title="TKV" />
            <p className="footer-brand">THE KINGDOM&apos;S VOICE</p>
          </div>
          <p className="footer-tagline">{t('home_subtitle')}</p>
          <nav className="footer-nav-simple" aria-label={t('footer_nav_label')}>
            {footerLinks.slice(0, 4).map(({ to, labelKey }) => (
              <Link
                key={to}
                to={to}
                className="footer-nav-simple-link"
                onMouseEnter={warmRoute(to)}
                onFocus={warmRoute(to)}
                onTouchStart={warmRoute(to)}
              >
                {t(labelKey)}
              </Link>
            ))}
          </nav>
          <p className="footer-copy">&copy; {new Date().getFullYear()} TKV. {t('footer_rights')}</p>
        </div>
      </footer>

      <nav className="mobile-nav" aria-label="Navigation mobile">
        {mobileNavItems.map(({ to, icon: Icon, labelKey, mobileLabelKey, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
            onTouchStart={warmRoute(to)}
          >
            <Icon size={22} strokeWidth={1.75} />
            <span>{t(mobileLabelKey || labelKey)}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={`mobile-nav-link mobile-nav-tools-btn ${mobileToolsOpen || isOnToolRoute ? 'active' : ''}`}
          onClick={() => setMobileToolsOpen((open) => !open)}
          aria-expanded={mobileToolsOpen}
          aria-haspopup="dialog"
          aria-controls="mobile-tools-sheet"
        >
          <Wrench size={22} strokeWidth={1.75} />
          <span>{t('nav_mobile_tools')}</span>
        </button>
      </nav>

      {mobileToolsOpen && (
        <div
          className="nav-tools-mobile-overlay"
          role="presentation"
          onClick={() => setMobileToolsOpen(false)}
        >
          <div
            id="mobile-tools-sheet"
            className="nav-tools-mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={t('nav_tools')}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="nav-tools-mobile-grabber" aria-hidden />
            <header className="nav-tools-mobile-head">
              <h2 className="nav-tools-mobile-title">{t('nav_tools')}</h2>
              <button
                type="button"
                className="nav-tools-mobile-close"
                onClick={() => setMobileToolsOpen(false)}
                aria-label={t('nav_tools_close')}
              >
                <X size={20} />
              </button>
            </header>
            <div className="nav-tools-mobile-scroll">
              {renderToolsPanel('mobile')}
            </div>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} />
      </Suspense>
    </div>
  );
};

export default Layout;
