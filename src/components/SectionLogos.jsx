import { TkvMarkShell } from './icons/TkvMarkShell';
import './SectionLogos.css';

function Mark({ size, className, title, variant = 'app', children }) {
  return (
    <TkvMarkShell size={size} className={className} title={title} variant={variant}>
      {children}
    </TkvMarkShell>
  );
}

export const HomeLogo = ({ size = 40, className = '', title, variant = 'app' }) => (
  <Mark size={size} className={className} title={title} variant={variant}>
    <path d="M16 30 L32 17 L48 30" />
    <path d="M20 30 V46 H44 V30" />
    <path d="M28 46 V36 H36 V46" strokeWidth="2" />
  </Mark>
);

export const BibleLogo = ({ size = 40, className = '', title, variant = 'app' }) => (
  <Mark size={size} className={className} title={title} variant={variant}>
    <path d="M18 22 H30 V46 H18 Z" strokeWidth="2" />
    <path d="M34 22 H46 V46 H34 Z" strokeWidth="2" />
    <path d="M32 22 V46" strokeWidth="1.75" strokeOpacity="0.45" />
    <path d="M22 28 H26 M38 28 H42" strokeWidth="1.75" strokeOpacity="0.5" />
  </Mark>
);

export const HeritageLogo = ({ size = 40, className = '', title, variant = 'app' }) => (
  <Mark size={size} className={className} title={title} variant={variant}>
    <path d="M26 46 V28 L32 24 L38 28 V46" />
    <path d="M28 34 H36 M28 38 H36 M28 42 H34" strokeWidth="1.75" strokeOpacity="0.55" />
    <path d="M40 24 C44 26 46 30 46 34" strokeWidth="2" />
    <circle cx="46" cy="22" r="2" fill="currentColor" stroke="none" />
  </Mark>
);

export const LibraryLogo = ({ size = 40, className = '', title, variant = 'app' }) => (
  <Mark size={size} className={className} title={title} variant={variant}>
    <path d="M22 20 H42 C43.1 20 44 20.9 44 22 V46 H22 V20 Z" />
    <path d="M32 20 V46" strokeWidth="1.75" strokeOpacity="0.45" />
    <path d="M26 26 H30 M34 26 H38" strokeWidth="1.75" strokeOpacity="0.5" />
    <path d="M26 32 H38" strokeWidth="1.75" strokeOpacity="0.4" />
  </Mark>
);

export const CommunityLogo = ({ size = 40, className = '', title, variant = 'app' }) => (
  <Mark size={size} className={className} title={title} variant={variant}>
    <circle cx="32" cy="22" r="4.5" />
    <circle cx="20" cy="30" r="3.75" />
    <circle cx="44" cy="30" r="3.75" />
    <path d="M26.5 25.5 C28.5 27 35.5 27 37.5 25.5" strokeWidth="1.75" />
    <path d="M22 36 C26 40 38 40 42 36" strokeWidth="1.75" strokeOpacity="0.55" />
  </Mark>
);

export const CellsLogo = ({ size = 40, className = '', title, variant = 'app' }) => (
  <Mark size={size} className={className} title={title} variant={variant}>
    <circle cx="32" cy="32" r="14" />
    <path d="M18 32 H46" strokeWidth="1.75" strokeOpacity="0.45" />
    <ellipse cx="32" cy="32" rx="14" ry="5.5" strokeWidth="1.75" strokeOpacity="0.45" />
    <circle cx="24" cy="26" r="2" fill="currentColor" stroke="none" />
    <circle cx="40" cy="28" r="1.75" fill="currentColor" stroke="none" />
    <circle cx="32" cy="20" r="2" fill="var(--mark-accent)" stroke="none" />
  </Mark>
);

export const FriendsLogo = ({ size = 40, className = '', title, variant = 'app' }) => (
  <Mark size={size} className={className} title={title} variant={variant}>
    <circle cx="22" cy="26" r="5" />
    <circle cx="42" cy="26" r="5" />
    <path d="M14 44 C16 36 20 33 22 33" />
    <path d="M50 44 C48 36 44 33 42 33" />
    <path d="M27 44 C29 38 35 38 37 44" strokeWidth="1.75" strokeOpacity="0.55" />
  </Mark>
);

export const MapLogo = ({ size = 40, className = '', title, variant = 'app' }) => (
  <Mark size={size} className={className} title={title} variant={variant}>
    <circle cx="32" cy="32" r="15" />
    <path d="M17 32 H47" strokeWidth="1.75" strokeOpacity="0.4" />
    <path d="M32 17 V47" strokeWidth="1.75" strokeOpacity="0.4" />
    <path d="M32 24 L32 40 C35 37 37 37 40 40 V24 C37 27 35 27 32 24 Z" fill="currentColor" stroke="none" />
  </Mark>
);

export const ProfileLogo = ({ size = 40, className = '', title, variant = 'app' }) => (
  <Mark size={size} className={className} title={title} variant={variant}>
    <circle cx="32" cy="26" r="6" />
    <path d="M18 46 C20 37 25 34 32 34 C39 34 44 37 46 46" />
  </Mark>
);

export const CoursesLogo = ({ size = 40, className = '', title, variant = 'app' }) => (
  <Mark size={size} className={className} title={title} variant={variant}>
    <path d="M14 26 L32 18 L50 26 L32 34 Z" />
    <path d="M20 29 V40 C20 43 25 45 32 45 C39 45 44 43 44 40 V29" />
    <path d="M50 26 V38" strokeWidth="2" />
    <circle cx="50" cy="40" r="2" fill="currentColor" stroke="none" />
  </Mark>
);

const nav = (Icon) =>
  function NavIcon({ size = 18, className = '' }) {
    return <Icon size={size} className={`tkv-mark-nav ${className}`.trim()} variant="glyph" />;
  };

export const HomeNavIcon = nav(HomeLogo);
export const BibleNavIcon = nav(BibleLogo);
export const HeritageNavIcon = nav(HeritageLogo);
export const LibraryNavIcon = nav(LibraryLogo);
export const CommunityNavIcon = nav(CommunityLogo);
export const ProfileNavIcon = nav(ProfileLogo);
export const CoursesNavIcon = nav(CoursesLogo);
export const CellsNavIcon = nav(CellsLogo);
export const FriendsNavIcon = nav(FriendsLogo);
export const MapNavIcon = nav(MapLogo);
