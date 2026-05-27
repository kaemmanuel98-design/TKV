import { config } from '../config.js';

const rateBuckets = new Map();

function clientKey(req) {
  const uid = req.user?.id;
  if (uid) return `user:${uid}`;
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress;
  return `ip:${ip || 'unknown'}`;
}

/** Fenêtre glissante simple (sans dépendance externe). */
export function rateLimit({ windowMs = 60_000, max = 60, keyPrefix = '' } = {}) {
  return (req, res, next) => {
    const key = `${keyPrefix}:${clientKey(req)}`;
    const now = Date.now();
    let bucket = rateBuckets.get(key);
    if (!bucket || now - bucket.start > windowMs) {
      bucket = { start: now, count: 0 };
      rateBuckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
      return res.status(429).json({ error: 'rate_limited' });
    }
    next();
  };
}

export function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (config.isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

export function safeErrorMessage(err) {
  if (!config.isProduction) return err?.message || 'error';
  return 'internal_error';
}
