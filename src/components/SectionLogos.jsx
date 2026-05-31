import { useId } from 'react';
import './SectionLogos.css';

const VIEWBOX = '0 0 64 64';

function MarkShell({ size, className, title, children, id }) {
  const gold = `tkv-gold-${id}`;
  const bg = `tkv-bg-${id}`;
  const accent = `tkv-accent-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      overflow="visible"
      className={`tkv-mark-svg ${className}`.trim()}
      role={title ? 'img' : 'presentation'}
      aria-hidden={!title}
      preserveAspectRatio="xMidYMid meet"
    >
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={gold} x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F2E4BC" />
          <stop offset="0.5" stopColor="#C9A962" />
          <stop offset="1" stopColor="#7A6842" />
        </linearGradient>
        <linearGradient id={accent} x1="8" y1="48" x2="56" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4B87A" stopOpacity="0.5" />
          <stop offset="1" stopColor="#9B7ED9" stopOpacity="0.2" />
        </linearGradient>
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
        strokeOpacity="0.38"
      />
      {children({ gold, accent })}
    </svg>
  );
}

/** Accueil — seuil ouvert, lumière d'accueil, toit protecteur. */
export const HomeLogo = ({ size = 40, className = '', title }) => {
  const id = useId().replace(/:/g, '');
  const glow = `tkv-home-glow-${id}`;
  return (
    <MarkShell size={size} className={className} title={title} id={id}>
      {({ gold, accent }) => (
        <>
          <defs>
            <radialGradient id={glow} cx="32" cy="30" r="16" gradientUnits="userSpaceOnUse">
              <stop stopColor="#C9A962" stopOpacity="0.45" />
              <stop offset="0.65" stopColor="#9B7ED9" stopOpacity="0.12" />
              <stop offset="1" stopColor="#C9A962" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="32" cy="32" rx="18" ry="14" fill={`url(#${glow})`} />
          <path
            d="M16 46V32c0-8.8 7.2-16 16-16s16 7.2 16 16v14"
            stroke={`url(#${gold})`}
            strokeWidth="2.4"
            strokeLinecap="round"
            fill={`url(#${accent})`}
            fillOpacity="0.2"
          />
          <path
            d="M20 46V33a12 12 0 0 1 24 0v13"
            stroke={`url(#${gold})`}
            strokeWidth="1.2"
            strokeOpacity="0.4"
            fill="none"
          />
          <path
            d="M14 28 L32 16 L50 28"
            stroke={`url(#${gold})`}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeOpacity="0.55"
          />
          <path
            d="M32 16v4"
            stroke={`url(#${gold})`}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.5"
          />
          <circle cx="32" cy="15" r="2.5" fill={`url(#${gold})`} />
          <path
            d="M26 36c2 3 4 4.5 6 4.5s4-1.5 6-4.5"
            stroke={`url(#${gold})`}
            strokeWidth="1.3"
            strokeLinecap="round"
            fill="none"
            strokeOpacity="0.45"
          />
          <path
            d="M24 40h16"
            stroke={`url(#${gold})`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.7"
          />
          <path
            d="M18 48.5h28"
            stroke={`url(#${gold})`}
            strokeWidth="1"
            strokeLinecap="round"
            strokeOpacity="0.22"
          />
        </>
      )}
    </MarkShell>
  );
};

/** Bible Strong — Écritures ouvertes, traits hébreu stylisé. */
export const BibleLogo = ({ size = 40, className = '', title }) => {
  const id = useId().replace(/:/g, '');
  return (
    <MarkShell size={size} className={className} title={title} id={id}>
      {({ gold, accent }) => (
        <>
          <path
            d="M22 48V24c0-1 1-2 2.2-2.2l7.8-1.8 7.8 1.8c1.2.2 2.2 1.2 2.2 2.2v24"
            stroke={`url(#${gold})`}
            strokeWidth="1.2"
            fill={`url(#${accent})`}
            fillOpacity="0.18"
          />
          <path
            d="M24 26c3 4 5 9 6 15M40 26c-3 4-5 9-6 15"
            stroke={`url(#${gold})`}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M32 22v26" stroke={`url(#${gold})`} strokeWidth="1.2" strokeOpacity="0.4" />
          <path
            d="M28 20h8"
            stroke={`url(#${gold})`}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.5"
          />
          <path
            d="M29 17c1.5-1 4.5-1 6 0"
            stroke="#9B7ED9"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            strokeOpacity="0.6"
          />
          <path
            d="M18 48.5h28"
            stroke={`url(#${gold})`}
            strokeWidth="1"
            strokeLinecap="round"
            strokeOpacity="0.22"
          />
        </>
      )}
    </MarkShell>
  );
};

/** Héritage — colonne, bouclier et fil du temps. */
export const HeritageLogo = ({ size = 40, className = '', title }) => {
  const id = useId().replace(/:/g, '');
  return (
    <MarkShell size={size} className={className} title={title} id={id}>
      {({ gold, accent }) => (
        <>
          <path
            d="M14 36c4-10 10-14 18-14s14 4 18 14"
            stroke={`url(#${gold})`}
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            strokeOpacity="0.35"
          />
          <path
            d="M26 46V28l6-3 6 3v18"
            stroke={`url(#${gold})`}
            strokeWidth="2"
            strokeLinejoin="round"
            fill={`url(#${accent})`}
            fillOpacity="0.15"
          />
          <path
            d="M28 34h8M28 38h8M28 42h6"
            stroke={`url(#${gold})`}
            strokeWidth="1"
            strokeLinecap="round"
            strokeOpacity="0.45"
          />
          <path
            d="M38 22c4 2 6 5 6 9s-2 7-6 9"
            stroke={`url(#${gold})`}
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="44" cy="20" r="2.5" fill={`url(#${gold})`} fillOpacity="0.7" />
          <path
            d="M18 48.5h28"
            stroke={`url(#${gold})`}
            strokeWidth="1"
            strokeLinecap="round"
            strokeOpacity="0.22"
          />
        </>
      )}
    </MarkShell>
  );
};

/** Bibliothèque — livre ouvert, tranche dorée, signet. */
export const LibraryLogo = ({ size = 40, className = '', title }) => {
  const id = useId().replace(/:/g, '');
  return (
    <MarkShell size={size} className={className} title={title} id={id}>
      {({ gold, accent }) => (
        <>
          <path
            d="M22 48V22c0-.5.4-.8.9-.7l9.1 2.4 9.1-2.4c.5-.1.9.2.9.7v26"
            stroke={`url(#${gold})`}
            strokeWidth="1.2"
            strokeOpacity="0.35"
            fill={`url(#${accent})`}
            fillOpacity="0.25"
          />
          <path
            d="M32 19.5 L32 48"
            stroke={`url(#${gold})`}
            strokeWidth="1.5"
            strokeOpacity="0.45"
          />
          <path
            d="M22 22.5c0-1.2 1-2.2 2.2-2.5l7.8-2 7.8 2c1.2.3 2.2 1.3 2.2 2.5v2.5H22V22.5z"
            fill={`url(#${gold})`}
            fillOpacity="0.12"
            stroke={`url(#${gold})`}
            strokeWidth="1.2"
          />
          <path
            d="M23 24.5c4 2.5 6 6 7 12.5 1-6.5 3-10 9-12.5"
            stroke={`url(#${gold})`}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M41 24.5c-4 2.5-6 6-7 12.5-1-6.5-3-10-9-12.5"
            stroke={`url(#${gold})`}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M28 20v28l4-1.2V18.8L28 20z"
            fill={`url(#${gold})`}
            fillOpacity="0.35"
          />
          <path
            d="M38 46l2-14 2 2-1.5 12"
            stroke="#C9A962"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeOpacity="0.85"
          />
          <path
            d="M18 48.5h28"
            stroke={`url(#${gold})`}
            strokeWidth="1"
            strokeLinecap="round"
            strokeOpacity="0.25"
          />
        </>
      )}
    </MarkShell>
  );
};

/** Communauté — trois voix reliées en cercle de fraternité. */
export const CommunityLogo = ({ size = 40, className = '', title }) => {
  const id = useId().replace(/:/g, '');
  return (
    <MarkShell size={size} className={className} title={title} id={id}>
      {({ gold, accent }) => (
        <>
          <ellipse cx="32" cy="34" rx="20" ry="11" fill={`url(#${accent})`} opacity="0.7" />
          <path
            d="M14 36c6-8 14-12 18-12s12 4 18 12"
            stroke={`url(#${gold})`}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeOpacity="0.35"
            fill="none"
          />
          <path
            d="M18 30c4-6 9-9 14-9s10 3 14 9"
            stroke={`url(#${gold})`}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.5"
            fill="none"
          />
          <circle cx="32" cy="22" r="5.5" fill={`url(#${gold})`} fillOpacity="0.2" stroke={`url(#${gold})`} strokeWidth="1.8" />
          <circle cx="19" cy="30" r="4.5" fill={`url(#${gold})`} fillOpacity="0.15" stroke={`url(#${gold})`} strokeWidth="1.6" />
          <circle cx="45" cy="30" r="4.5" fill={`url(#${gold})`} fillOpacity="0.15" stroke={`url(#${gold})`} strokeWidth="1.6" />
          <path
            d="M26.5 24.5c2.5 1.5 8.5 1.5 11 0"
            stroke={`url(#${gold})`}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeOpacity="0.55"
          />
          <path
            d="M22 30.5c3 2 6 2.5 10 2.5s7-.5 10-2.5"
            stroke={`url(#${gold})`}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeOpacity="0.45"
          />
          <path
            d="M23.5 26.5l4.5 2.5 8.5-5"
            stroke={`url(#${gold})`}
            strokeWidth="1"
            strokeLinecap="round"
            strokeOpacity="0.4"
            fill="none"
          />
          <path
            d="M40.5 26.5l-4.5 2.5-8.5-5"
            stroke={`url(#${gold})`}
            strokeWidth="1"
            strokeLinecap="round"
            strokeOpacity="0.4"
            fill="none"
          />
          <path
            d="M28 38c2 2.5 8 2.5 10 0"
            stroke="#C9A962"
            strokeWidth="1.3"
            strokeLinecap="round"
            fill="none"
            strokeOpacity="0.5"
          />
        </>
      )}
    </MarkShell>
  );
};

/** Cellules — globe et points de prière reliés. */
export const CellsLogo = ({ size = 40, className = '', title }) => {
  const id = useId().replace(/:/g, '');
  return (
    <MarkShell size={size} className={className} title={title} id={id}>
      {({ gold, accent }) => (
        <>
          <ellipse cx="32" cy="34" rx="20" ry="11" fill={`url(#${accent})`} opacity="0.7" />
          <circle cx="32" cy="30" r="14" stroke={`url(#${gold})`} strokeWidth="1.4" fill="none" strokeOpacity="0.45" />
          <path
            d="M18 30c0-7.7 6.3-14 14-14s14 6.3 14 14"
            stroke={`url(#${gold})`}
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            strokeOpacity="0.35"
          />
          <circle cx="22" cy="24" r="2.2" fill="#C9A962" fillOpacity="0.85" />
          <circle cx="42" cy="26" r="2" fill="#C9A962" fillOpacity="0.7" />
          <circle cx="32" cy="18" r="2.4" fill="#C9A962" fillOpacity="0.9" />
          <circle cx="26" cy="36" r="1.8" fill="#9B7ED9" fillOpacity="0.65" />
          <circle cx="38" cy="38" r="1.6" fill="#9B7ED9" fillOpacity="0.55" />
          <path
            d="M22 24l10-4M42 26l-10 2M32 18v8"
            stroke={`url(#${gold})`}
            strokeWidth="0.9"
            strokeLinecap="round"
            strokeOpacity="0.4"
          />
        </>
      )}
    </MarkShell>
  );
};

/** Amis — deux silhouettes reliées. */
export const FriendsLogo = ({ size = 40, className = '', title }) => {
  const id = useId().replace(/:/g, '');
  return (
    <MarkShell size={size} className={className} title={title} id={id}>
      {({ gold, accent }) => (
        <>
          <ellipse cx="32" cy="36" rx="18" ry="10" fill={`url(#${accent})`} opacity="0.65" />
          <path
            d="M20 38c3-5 7-7 12-7s9 2 12 7"
            stroke={`url(#${gold})`}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeOpacity="0.35"
            fill="none"
          />
          <circle cx="22" cy="26" r="5" fill={`url(#${gold})`} fillOpacity="0.18" stroke={`url(#${gold})`} strokeWidth="1.7" />
          <circle cx="42" cy="26" r="5" fill={`url(#${gold})`} fillOpacity="0.18" stroke={`url(#${gold})`} strokeWidth="1.7" />
          <path
            d="M27 26h10"
            stroke={`url(#${gold})`}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeOpacity="0.55"
          />
          <path
            d="M24 30c4 2.5 12 2.5 16 0"
            stroke="#C9A962"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            strokeOpacity="0.45"
          />
        </>
      )}
    </MarkShell>
  );
};

/** Carte du Royaume — globe et marqueur. */
export const MapLogo = ({ size = 40, className = '', title }) => {
  const id = useId().replace(/:/g, '');
  return (
    <MarkShell size={size} className={className} title={title} id={id}>
      {({ gold, accent }) => (
        <>
          <circle cx="32" cy="32" r="17" stroke={`url(#${gold})`} strokeWidth="1.3" fill={`url(#${accent})`} fillOpacity="0.12" strokeOpacity="0.45" />
          <path
            d="M15 32c0-9.4 7.6-17 17-17s17 7.6 17 17"
            stroke={`url(#${gold})`}
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            strokeOpacity="0.35"
          />
          <ellipse cx="32" cy="32" rx="17" ry="6.5" stroke={`url(#${gold})`} strokeWidth="0.9" fill="none" strokeOpacity="0.28" />
          <path
            d="M32 15v34M15 32h34"
            stroke={`url(#${gold})`}
            strokeWidth="0.7"
            strokeOpacity="0.2"
          />
          <path
            d="M32 22c-3 2.5-3 6.5 0 9.5s3 7 0 9.5"
            stroke="#C9A962"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
            strokeOpacity="0.55"
          />
          <circle cx="32" cy="32" r="2.2" fill="#C9A962" fillOpacity="0.9" />
        </>
      )}
    </MarkShell>
  );
};

/** Profil — silhouette et chemin personnel. */
export const ProfileLogo = ({ size = 40, className = '', title }) => {
  const id = useId().replace(/:/g, '');
  return (
    <MarkShell size={size} className={className} title={title} id={id}>
      {({ gold, accent }) => (
        <>
          <circle cx="32" cy="32" r="18" stroke={`url(#${gold})`} strokeWidth="1.2" strokeOpacity="0.3" fill={`url(#${accent})`} fillOpacity="0.35" />
          <path
            d="M22 46c2-6 6-10 10-10s8 4 10 10"
            stroke={`url(#${gold})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="32" cy="26" r="6" fill={`url(#${gold})`} fillOpacity="0.25" stroke={`url(#${gold})`} strokeWidth="1.8" />
          <path
            d="M16 44c4-10 10-14 16-14s12 4 16 14"
            stroke={`url(#${gold})`}
            strokeWidth="1"
            strokeLinecap="round"
            strokeOpacity="0.25"
            fill="none"
          />
          <path
            d="M44 20c-3 4-3 8 0 12"
            stroke="#9B7ED9"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeOpacity="0.55"
            fill="none"
          />
          <circle cx="44" cy="18" r="2" fill="#C9A962" fillOpacity="0.7" />
          <path
            d="M18 48.5h28"
            stroke={`url(#${gold})`}
            strokeWidth="1"
            strokeLinecap="round"
            strokeOpacity="0.22"
          />
        </>
      )}
    </MarkShell>
  );
};

export const HomeNavIcon = ({ size = 18, className = '' }) => (
  <HomeLogo size={size} className={`tkv-mark-nav ${className}`.trim()} />
);

export const BibleNavIcon = ({ size = 18, className = '' }) => (
  <BibleLogo size={size} className={`tkv-mark-nav ${className}`.trim()} />
);

export const HeritageNavIcon = ({ size = 18, className = '' }) => (
  <HeritageLogo size={size} className={`tkv-mark-nav ${className}`.trim()} />
);

export const LibraryNavIcon = ({ size = 18, className = '' }) => (
  <LibraryLogo size={size} className={`tkv-mark-nav ${className}`.trim()} />
);

export const CommunityNavIcon = ({ size = 18, className = '' }) => (
  <CommunityLogo size={size} className={`tkv-mark-nav ${className}`.trim()} />
);

export const ProfileNavIcon = ({ size = 18, className = '' }) => (
  <ProfileLogo size={size} className={`tkv-mark-nav ${className}`.trim()} />
);
