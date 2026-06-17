import { TkvMarkShell } from './icons/TkvMarkShell';
import './Logo.css';

/**
 * Symbole TKV — voix / lumière, trait minimal type SF Symbol.
 */
export const LogoMark = ({ size = 40, className = '', title, variant = 'app' }) => (
  <TkvMarkShell size={size} className={`logo-mark-svg ${className}`.trim()} title={title} variant={variant} accent>
    <circle cx="32" cy="19" r="3.25" fill="var(--mark-accent)" stroke="none" />
    <line x1="32" y1="23.5" x2="32" y2="43" />
    <path d="M22 38 C22 30.5 26.5 26 32 26" />
    <path d="M42 38 C42 30.5 37.5 26 32 26" />
    <path d="M20 44 H44" strokeOpacity="0.35" strokeWidth="1.75" />
  </TkvMarkShell>
);

export const LogoImage = ({ size = 40, className = '', alt = 'TKV' }) => (
  <img
    src="/favicon.svg"
    width={size}
    height={size}
    alt={alt}
    className={`logo-mark-img ${className}`.trim()}
    decoding="async"
  />
);

export const LogoFull = ({ markSize = 44, className = '' }) => (
  <div className={`logo-full ${className}`.trim()}>
    <LogoMark size={markSize} title="TKV" />
    <div className="logo-full-text">
      <span className="logo-full-name">TKV</span>
      <span className="logo-full-tagline">The Kingdom&apos;s Voice</span>
    </div>
  </div>
);

export default LogoMark;
