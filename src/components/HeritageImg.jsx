import React from 'react';
import { HERITAGE_LOCAL } from '../lib/heritageMedia';

/** Illustration locale Héritage (SVG bundlé). */
export default function HeritageImg({
  src,
  fallback = HERITAGE_LOCAL.default,
  alt = '',
  className,
  loading = 'lazy',
  eager = false,
}) {
  const current = src || fallback;
  if (!current) return null;

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : loading}
      decoding="async"
    />
  );
}
