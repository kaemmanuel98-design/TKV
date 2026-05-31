/** Droits animateur cellule (alignés sur server/lib/cellHost.js). */
export function canCreateCellFromProfile(profile) {
  if (!profile) return false;
  if (profile.can_host_visio === true) return true;
  if (profile.is_premium) return true;
  const plan = profile.plan_type || 'free';
  return plan === 'premium' || plan === 'premium_plus';
}
