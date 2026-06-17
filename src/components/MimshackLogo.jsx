import { TkvMarkShell } from './icons/TkvMarkShell';
import './MimshackLogo.css';

/**
 * Marque Mim — monogramme M épuré, aligné sur le système d’icônes TKV.
 */
export const MimshackLogo = ({ size = 40, className = '', title, showWordmark = false, variant = 'app' }) => {
  const mark = (
    <TkvMarkShell
      size={size}
      className={`mimshack-logo-svg ${className}`.trim()}
      title={title}
      variant={variant}
      accent
    >
      <path d="M20 44 V26 L32 38 L44 26 V44" strokeWidth="2.5" />
      <circle cx="32" cy="20" r="2.5" fill="var(--mark-accent-secondary)" stroke="none" />
    </TkvMarkShell>
  );

  if (!showWordmark) return mark;

  return (
    <div className="mimshack-logo-wrap">
      {mark}
      <span className="mimshack-wordmark">Mim</span>
    </div>
  );
};

export const MimshackNavIcon = ({ size = 18, className = '' }) => (
  <MimshackLogo size={size} className={`tkv-mark-nav ${className}`.trim()} variant="glyph" />
);

export default MimshackLogo;
