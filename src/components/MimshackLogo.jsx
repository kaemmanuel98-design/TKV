import { useId } from 'react';
import './MimshackLogo.css';

const VIEWBOX = '0 0 64 64';

/**
 * Marque Mim — assistant biblique TKV.
 * Monogramme M, halo de discernement, palette or / violet alignée TKV.
 */
export const MimshackLogo = ({ size = 40, className = '', title, showWordmark = false }) => {
  const id = useId().replace(/:/g, '');
  const gold = `mim-gold-${id}`;
  const violet = `mim-violet-${id}`;
  const bg = `mim-bg-${id}`;
  const glow = `mim-glow-${id}`;

  const mark = (
    <svg
      width={size}
      height={size}
      viewBox={VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      overflow="visible"
      className={`mimshack-logo-svg ${className}`.trim()}
      role={title ? 'img' : 'presentation'}
      aria-hidden={!title}
      preserveAspectRatio="xMidYMid meet"
    >
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={gold} x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F2E4BC" />
          <stop offset="0.5" stopColor="#C9A962" />
          <stop offset="1" stopColor="#7A6842" />
        </linearGradient>
        <linearGradient id={violet} x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9B7ED9" stopOpacity="0.55" />
          <stop offset="1" stopColor="#5C4A8F" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id={glow} cx="32" cy="20" r="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C9A962" stopOpacity="0.35" />
          <stop offset="1" stopColor="#C9A962" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={bg} x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#18161F" />
          <stop offset="1" stopColor="#0A0A0C" />
        </linearGradient>
      </defs>

      <rect x="4" y="4" width="56" height="56" rx="14" fill={`url(#${bg})`} />
      <rect
        x="4.5"
        y="4.5"
        width="55"
        height="55"
        rx="13.5"
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth="1"
        strokeOpacity="0.4"
      />

      <circle cx="32" cy="22" r="16" fill={`url(#${glow})`} />
      <ellipse cx="32" cy="30" rx="22" ry="10" fill={`url(#${violet})`} opacity="0.85" />

      <path
        d="M22 46V24.5c0-.6.7-.9 1.1-.5l8.4 9.2c.5.5 1.2.5 1.7 0l8.4-9.2c.4-.4 1.1-.1 1.1.5V46"
        stroke={`url(#${gold})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      <path
        d="M32 24v6"
        stroke={`url(#${gold})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
      <circle cx="32" cy="21" r="2.8" fill={`url(#${gold})`} />
      <circle cx="32" cy="21" r="5" stroke="#9B7ED9" strokeWidth="0.75" strokeOpacity="0.45" fill="none" />

      <path
        d="M18 48.5h28"
        stroke={`url(#${gold})`}
        strokeWidth="1"
        strokeLinecap="round"
        strokeOpacity="0.28"
      />
    </svg>
  );

  if (!showWordmark) return mark;

  return (
    <span className={`mimshack-logo-full ${className}`.trim()}>
      {mark}
      <span className="mimshack-logo-wordmark">Mim</span>
    </span>
  );
};

export const MimshackNavIcon = ({ size = 18, className = '' }) => (
  <MimshackLogo size={size} className={`mimshack-nav-icon ${className}`.trim()} />
);

export default MimshackLogo;
