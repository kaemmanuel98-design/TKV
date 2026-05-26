import { useId } from 'react';
import './Logo.css';

const MARK_VIEWBOX = '0 0 64 64';

/**
 * Symbole TKV complet — arcs, ondes, axe, lumière, horizon.
 * viewBox avec marge + overflow visible pour éviter tout clipping.
 */
export const LogoMark = ({ size = 40, className = '', title }) => {
  const id = useId().replace(/:/g, '');
  const gold = `tkv-gold-${id}`;
  const beam = `tkv-beam-${id}`;
  const bg = `tkv-bg-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={MARK_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      overflow="visible"
      className={`logo-mark-svg ${className}`.trim()}
      role={title ? 'img' : 'presentation'}
      aria-hidden={!title}
      preserveAspectRatio="xMidYMid meet"
    >
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={gold} x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F0E2B8" />
          <stop offset="0.45" stopColor="#C9A962" />
          <stop offset="1" stopColor="#8A7340" />
        </linearGradient>
        <linearGradient id={beam} x1="32" y1="14" x2="32" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E8D5A3" />
          <stop offset="1" stopColor="#C9A962" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={bg} x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#161618" />
          <stop offset="1" stopColor="#0A0A0C" />
        </linearGradient>
      </defs>

      {/* Fond + cadre */}
      <rect x="4" y="4" width="56" height="56" rx="13" fill={`url(#${bg})`} />
      <rect
        x="4.5"
        y="4.5"
        width="55"
        height="55"
        rx="12.5"
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth="1"
        strokeOpacity="0.35"
      />

      {/* Arcs supérieurs ouverts (invitation) */}
      <path
        d="M32 13 A19 19 0 0 0 13 29"
        stroke={`url(#${gold})`}
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
      <path
        d="M32 13 A19 19 0 0 1 51 29"
        stroke={`url(#${gold})`}
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />

      {/* Ondes vocales gauche */}
      <path
        d="M25 41 C17 36 18 28 22 23"
        stroke={`url(#${gold})`}
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <path
        d="M23 45 C13 38 14 27 19 20"
        stroke={`url(#${gold})`}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeOpacity="0.65"
      />

      {/* Ondes vocales droite */}
      <path
        d="M39 41 C47 36 46 28 42 23"
        stroke={`url(#${gold})`}
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <path
        d="M41 45 C51 38 50 27 45 20"
        stroke={`url(#${gold})`}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeOpacity="0.65"
      />

      {/* Axe de clarté */}
      <line
        x1="32"
        y1="18"
        x2="32"
        y2="47"
        stroke={`url(#${beam})`}
        strokeWidth="2.6"
        strokeLinecap="round"
      />

      {/* Lumière au sommet */}
      <circle cx="32" cy="14" r="6.5" fill="#C9A962" fillOpacity="0.14" />
      <circle cx="32" cy="14" r="3.2" fill={`url(#${gold})`} />

      {/* Horizon */}
      <path
        d="M20 49.5 H44"
        stroke={`url(#${gold})`}
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeOpacity="0.35"
      />
    </svg>
  );
};

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
