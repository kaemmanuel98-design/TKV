/** Droits animateur cellule (alignés sur server/app.js resolveCanHostVisio). */
export function canCreateCellFromProfile(profile) {
  if (!profile) return false;
  if (profile.can_host_visio === true) return true;
  if (profile.plan_type === 'premium_plus') return true;
  if (profile.is_premium && profile.plan_type === 'premium_plus') return true;
  return false;
}
