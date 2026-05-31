/** Droits animateur visio / cellule (Premium+, profil, e-mails admin). */
export function resolvePlanType(profile) {
  if (!profile) return 'free';
  const plan = profile.plan_type || 'free';
  if (plan === 'premium_plus') return 'premium_plus';
  if (profile.is_premium && plan === 'premium_plus') return 'premium_plus';
  return plan;
}

export function resolveCanHostVisio(user, profile, hostEmails = []) {
  if (profile?.can_host_visio === true) return true;
  if (resolvePlanType(profile) === 'premium_plus') return true;
  const email = (user?.email || '').toLowerCase();
  return Boolean(email && hostEmails.includes(email));
}

export function resolveJitsiHostIntent({ profile, user, hostEmails, asHost }) {
  const eligible = resolveCanHostVisio(user, profile, hostEmails);
  if (!eligible) return false;
  if (asHost === false) return false;
  return true;
}
