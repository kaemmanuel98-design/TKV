import { config } from '../config.js';

export function resolveIsCompanion(user, profile) {
  if (profile?.is_confessional_companion === true) return true;
  const email = (user?.email || '').toLowerCase();
  return Boolean(email && config.companionEmails.includes(email));
}

export function jwtAalFromToken(token) {
  if (!token) return 'aal1';
  try {
    const part = token.split('.')[1];
    if (!part) return 'aal1';
    const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const payload = JSON.parse(json);
    return payload.aal || 'aal1';
  } catch {
    return 'aal1';
  }
}

export function companionAccessDenied(req) {
  if (!resolveIsCompanion(req.user, req.profile)) {
    return { status: 403, error: 'companion_forbidden' };
  }
  if (config.companionRequireMfa) {
    const header = req.headers.authorization || '';
    const token = header.replace(/^Bearer\s+/i, '');
    if (jwtAalFromToken(token) !== 'aal2') {
      return { status: 403, error: 'mfa_required' };
    }
  }
  return null;
}
