/** Profil Premium actif — même logique que server/lib/premiumAccess.js */
export function isPremiumProfile(profile) {
  if (!profile) return false;

  const untilRaw = profile.premium_until;
  if (untilRaw) {
    const until = new Date(untilRaw);
    if (!Number.isNaN(until.getTime())) {
      if (until.getTime() > Date.now()) return true;
      if (profile.is_premium || profile.plan_type === 'premium' || profile.plan_type === 'premium_plus') {
        return false;
      }
    }
  }

  if (profile.is_premium === true) return true;
  const plan = profile.plan_type || 'free';
  return plan === 'premium' || plan === 'premium_plus';
}

export function resolvePlanType(profile) {
  return isPremiumProfile(profile) ? 'premium' : profile?.plan_type || 'free';
}
