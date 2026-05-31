/** Droits animateur visio / cellule (Premium, profil animateur, e-mails admin). */

export function isPremiumProfile(profile) {
  if (!profile) return false;
  if (profile.is_premium) return true;
  const plan = profile.plan_type || 'free';
  return plan === 'premium' || plan === 'premium_plus';
}

export function resolveCanHostVisio(user, profile, hostEmails = []) {
  if (profile?.can_host_visio === true) return true;
  if (isPremiumProfile(profile)) return true;
  const email = (user?.email || '').toLowerCase();
  return Boolean(email && hostEmails.includes(email));
}

export function resolveJitsiHostIntent({ profile, user, hostEmails, asHost }) {
  const eligible = resolveCanHostVisio(user, profile, hostEmails);
  if (!eligible) return false;
  if (asHost === false) return false;
  return true;
}
