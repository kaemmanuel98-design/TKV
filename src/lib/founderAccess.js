const DEV_DEFAULT_FOUNDER = 'kaemmanuel98@gmail.com';

function parseEmailList(raw) {
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** E-mails avec accès Premium complet côté client (Vite). */
export function getFounderEmails() {
  const explicit = parseEmailList(import.meta.env.VITE_FOUNDER_EMAILS || '');
  if (explicit.length) return [...new Set(explicit)];

  const jitsi = parseEmailList(import.meta.env.VITE_JITSI_HOST_EMAILS || '');
  const companion = parseEmailList(import.meta.env.VITE_COMPANION_HOST_EMAILS || '');
  const merged = [...jitsi, ...companion];
  if (merged.length) return [...new Set(merged)];

  if (import.meta.env.DEV) return [DEV_DEFAULT_FOUNDER];
  return [];
}

export function isFounderEmail(email) {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return false;
  return getFounderEmails().includes(normalized);
}

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
