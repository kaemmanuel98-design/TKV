import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Heart,
  Globe,
  Moon,
  Sun,
  Headphones,
  DoorClosed,
  HeartHandshake,
  Info,
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
import FriendPresenceToasts from './FriendPresenceToasts';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { LogoMark } from './Logo';
import ProfileAvatar from './ProfileAvatar';
import PaymentModal from './PaymentModal';
import OnboardingGate from './OnboardingGate';
import { useCompanionAccess } from '../hooks/useCompanionAccess';
import { useTheme } from '../hooks/useTheme';
import './Layout.css';

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

const toolLinks = [
  { to: '/agent', icon: MimshackNavIcon, labelKey: 'tab_agent' },
  { to: '/community', icon: CommunityNavIcon, labelKey: 'tab_community' },
  { to: '/bible', icon: BibleNavIcon, labelKey: 'nav_bible' },
  { to: '/heritage', icon: HeritageNavIcon, labelKey: 'nav_heritage' },
  { to: '/confessional', icon: DoorClosed, labelKey: 'nav_confessional' },
  { to: '/podcasts', icon: Headphones, labelKey: 'podcast_page_title' },
  { to: '/friends', icon: FriendsNavIcon, labelKey: 'friends_nav' },
  { to: '/map', icon: MapNavIcon, labelKey: 'map' },
  { to: '/cells', icon: CellsNavIcon, labelKey: 'footer_link_cells' },
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
  const { user, signOut } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const profile = useProfileStore((s) => s.profile);
  const { isCompanion } = useCompanionAccess();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const visibleToolLinks = isCompanion
    ? [
        ...toolLinks.slice(0, 3),
        { to: '/companion', icon: HeartHandshake, labelKey: 'nav_companion' },
        ...toolLinks.slice(3),
      ]
    : toolLinks;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (user?.id) fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="layout-container">
      {user && <FriendPresenceToasts />}
      <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
        <Link to="/" className="logo">
          <div className="logo-mark">
            <LogoMark size={40} title="TKV — The Kingdom's Voice" />
          </div>
          <div className="logo-text">
            <strong>TKV</strong>
            <span>The Kingdom&apos;s Voice</span>
          </div>
        </Link>

        <nav className="nav-desktop" aria-label="Navigation principale">
          {mainNavItems.map(({ to, icon: Icon, labelKey, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={t(labelKey)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
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
              className="btn btn-ghost btn-sm nav-tools-btn hide-mobile"
              onClick={() => setToolsOpen((o) => !o)}
              aria-expanded={toolsOpen}
            >
              {t('nav_tools')}
            </button>
            {toolsOpen && (
              <div className="nav-tools-dropdown card">
                {visibleToolLinks.map(({ to, icon: Icon, labelKey }) => (
                  <Link key={to} to={to} className="nav-tools-link" onClick={() => setToolsOpen(false)}>
                    <Icon size={16} />
                    {t(labelKey)}
                  </Link>
                ))}
                <Link to="/about" className="nav-tools-link" onClick={() => setToolsOpen(false)}>
                  {t('layout_about')}
                </Link>
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
              <Link key={to} to={to} className="footer-nav-simple-link">
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
          >
            <Icon size={22} strokeWidth={1.75} />
            <span>{t(mobileLabelKey || labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} />
    </div>
  );
};

export default Layout;
