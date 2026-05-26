import app from '../server/app.js';

/**
 * Catch-all Vercel Function for every `/api/*` route.
 * We forward the request into the Express app so routes like `/api/jitsi/join`
 * keep working in production.
 */
export default async function handler(req, res) {
  const { path } = req.query || {};
  const segments = Array.isArray(path) ? path : path ? [path] : [];

  // Preserve query string (Express reads pathname separately anyway).
  const originalUrl = req.url || '';
  const qIndex = originalUrl.indexOf('?');
  const search = qIndex >= 0 ? originalUrl.slice(qIndex) : '';

  // Express routes in `server/app.js` all start with `/api/...`
  req.url = `/api/${segments.join('/')}${search}`;

  return app(req, res);
}

