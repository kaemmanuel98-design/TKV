import React from 'react';
import { LogoMark } from './Logo';

const PageHeader = ({
  eyebrow,
  title,
  subtitle,
  actions,
  centered = false,
  showLogo = false,
  className = '',
}) => (
  <header
    className={`page-header page-header-block ${centered ? 'page-header--center' : ''} ${className}`.trim()}
  >
    <div className={`page-header-main ${actions ? 'page-header-main--actions' : ''}`}>
      <div className={centered ? 'page-header-copy page-header-copy--center' : 'page-header-copy'}>
        {showLogo && (
          <div className="page-header-logo">
            <LogoMark size={48} />
          </div>
        )}
        {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
        {title && <h1 className="page-title">{title}</h1>}
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  </header>
);

export default PageHeader;
