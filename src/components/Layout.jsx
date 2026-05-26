import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Sparkles,
  Library,
  Users,
  User,
  Heart,
  Globe,
  Book,
  Clock,
  Map,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { LogoMark } from './Logo';
import ProfileAvatar from './ProfileAvatar';
import PaymentModal from './PaymentModal';
import OnboardingGate from './OnboardingGate';
import './Layout.css';

/** Navigation principale — CdC v3 §2.1 (5 onglets) */
const mainNavItems = [
  { to: '/', icon: Home, labelKey: 'tab_home', end: true },
  { to: '/agent', icon: Sparkles, labelKey: 'tab_agent' },
  { to: '/library', icon: Library, labelKey: 'tab_library' },
  { to: '/community', icon: Users, labelKey: 'tab_community' },
  { to: '/profile', icon: User, labelKey: 'tab_profile' },
];

const mobileNavItems = [
  { ...mainNavItems[0], mobileLabelKey: 'nav_mobile_home' },
  { ...mainNavItems[1], mobileLabelKey: 'nav_mobile_agent' },
  { ...mainNavItems[2], mobileLabelKey: 'nav_mobile_library' },
  { ...mainNavItems[3], mobileLabelKey: 'nav_mobile_community' },
  { ...mainNavItems[4], mobileLabelKey: 'nav_mobile_profile' },
];

const toolLinks = [
  { to: '/bible', icon: Book, labelKey: 'nav_bible' },
  { to: '/heritage', icon: Clock, labelKey: 'nav_heritage' },
  { to: '/map', icon: Map, labelKey: 'map' },
];

const Layout = () => {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuthStore();
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const profile = useProfileStore((s) => s.profile);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

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
                {toolLinks.map(({ to, icon: Icon, labelKey }) => (
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
              <User size={16} />
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
          <nav className="footer-nav" aria-label={t('footer_nav_label')}>
            <Link to="/about" className="footer-nav-link">
              {t('layout_about')}
            </Link>
            <span className="footer-nav-sep" aria-hidden="true" />
            <Link to="/bible" className="footer-nav-link">
              {t('bible')}
            </Link>
            <span className="footer-nav-sep" aria-hidden="true" />
            <Link to="/heritage" className="footer-nav-link">
              {t('heritage')}
            </Link>
            <span className="footer-nav-sep" aria-hidden="true" />
            <Link to="/cells" className="footer-nav-link">
              {t('cells')}
            </Link>
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
