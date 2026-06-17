import { useId } from 'react';

const VIEWBOX = '0 0 64 64';
const STROKE = 2.25;
const SHELL = { x: 6, y: 6, size: 52, rx: 12 };

/**
 * Conteneur d’icônes TKV — tuiles app / glyphes navigation.
 * variant="app"  → tuiles, en-têtes, favicon
 * variant="glyph" → barre de navigation, liens compacts
 */
export function TkvMarkShell({
  size = 40,
  className = '',
  title,
  variant = 'app',
  accent = false,
  children,
}) {
  const id = useId().replace(/:/g, '');
  const accentId = `tkv-mark-accent-${id}`;

  const shell = variant === 'app';

  return (
    <svg
      width={size}
      height={size}
      viewBox={VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      overflow="visible"
      className={`tkv-mark-svg tkv-mark-svg--${variant} ${className}`.trim()}
      role={title ? 'img' : 'presentation'}
      aria-hidden={!title}
      preserveAspectRatio="xMidYMid meet"
    >
      {title && <title>{title}</title>}
      {accent ? (
        <defs>
          <linearGradient id={accentId} x1="20" y1="12" x2="44" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--mark-accent)" />
            <stop offset="1" stopColor="var(--mark-accent-secondary)" />
          </linearGradient>
        </defs>
      ) : null}
      {shell ? (
        <>
          <rect
            x={SHELL.x}
            y={SHELL.y}
            width={SHELL.size}
            height={SHELL.size}
            rx={SHELL.rx}
            className="tkv-mark-shell-bg"
          />
          <rect
            x={SHELL.x + 0.5}
            y={SHELL.y + 0.5}
            width={SHELL.size - 1}
            height={SHELL.size - 1}
            rx={SHELL.rx - 0.5}
            className="tkv-mark-shell-border"
          />
        </>
      ) : null}
      <g
        className="tkv-mark-glyph"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        stroke={accent ? `url(#${accentId})` : 'currentColor'}
      >
        {children}
      </g>
    </svg>
  );
}

export { VIEWBOX, STROKE, SHELL };
