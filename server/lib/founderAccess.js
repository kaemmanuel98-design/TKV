import { config } from '../config.js';

const DEV_DEFAULT_FOUNDER = 'kaemmanuel98@gmail.com';

function parseEmailList(raw) {
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** E-mails avec accès Premium complet (fondateur / admin). */
export function getFounderEmails() {
  const explicit = parseEmailList(process.env.FOUNDER_EMAILS || '');
  if (explicit.length) return [...new Set(explicit)];

  const merged = [
    ...config.jitsiHostEmails,
    ...config.companionEmails,
  ];
  if (merged.length) return [...new Set(merged)];

  if (!config.isProduction) return [DEV_DEFAULT_FOUNDER];
  return [];
}

export function isFounderEmail(email) {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return false;
  return getFounderEmails().includes(normalized);
}

/** Fusionne les droits Premium complets sans écrire en base. */
export function enrichProfileWithFounderAccess(profile, email) {
  if (!isFounderEmail(email)) return profile;
  const base = profile ? { ...profile } : {};
  return {
    ...base,
    is_premium: true,
    plan_type: 'premium',
    can_host_visio: true,
    is_confessional_companion: true,
  };
}
