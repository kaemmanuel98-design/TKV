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
  const merged = [
    DEV_DEFAULT_FOUNDER,
    ...explicit,
    ...config.jitsiHostEmails,
    ...config.companionEmails,
  ];
  return [...new Set(merged.map((e) => e.toLowerCase()).filter(Boolean))];
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
  const premiumUntil = new Date();
  premiumUntil.setFullYear(premiumUntil.getFullYear() + 10);
  return {
    ...base,
    is_premium: true,
    plan_type: 'premium',
    premium_until: base.premium_until || premiumUntil.toISOString(),
    can_host_visio: true,
    is_confessional_companion: true,
    is_companion_admin: true,
    is_companion_super_admin: true,
  };
}
