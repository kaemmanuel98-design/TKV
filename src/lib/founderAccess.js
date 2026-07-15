function parseEmailList(raw) {
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** E-mails avec accès Premium complet côté client (Vite). Production : env uniquement. */
export function getFounderEmails() {
  const explicit = parseEmailList(import.meta.env.VITE_FOUNDER_EMAILS || '');
  const jitsi = parseEmailList(import.meta.env.VITE_JITSI_HOST_EMAILS || '');
  const companion = parseEmailList(import.meta.env.VITE_COMPANION_HOST_EMAILS || '');
  const merged = [...explicit, ...jitsi, ...companion];
  return [...new Set(merged.map((e) => e.toLowerCase()).filter(Boolean))];
}

export function isFounderEmail(email) {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return false;
  return getFounderEmails().includes(normalized);
}

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
