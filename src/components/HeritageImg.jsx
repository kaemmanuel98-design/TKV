import React, { useState } from 'react';
import { HERITAGE_LOCAL } from '../lib/heritageMedia';

/** Photo ou illustration Héritage avec repli SVG local si la photo échoue. */
export default function HeritageImg({
  src,
  fallback = HERITAGE_LOCAL.default,
  alt = '',
  className,
  loading = 'lazy',
  eager = false,
}) {
  const [failed, setFailed] = useState(false);
  const current = failed || !src ? fallback : src;

  if (!current) return null;

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
