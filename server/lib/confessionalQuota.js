import { getSupabaseAdmin, getUserProfile } from './supabaseAdmin.js';
import { resolvePlan } from './quota.js';

/** Quota Confessionnal — distinct de l''agent IA (CdC : accès bienveillant sans bloquer à 3 msgs agent). */
export const CONFESSIONAL_LIMITS = {
  free: 15,
  premium: 60,
  premium_plus: 9999,
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function checkAndIncrementConfessionalUsage(userId) {
  const profile = userId ? await getUserProfile(userId) : null;
  const plan = resolvePlan(profile);
  const limit = CONFESSIONAL_LIMITS[plan] ?? CONFESSIONAL_LIMITS.free;
  const admin = getSupabaseAdmin();

  if (admin && userId) {
    const date = todayKey();
    const { data: row } = await admin
      .from('ia_daily_usage')
      .select('confessional_count, requests_count, perspectives_count')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();

    const current = row?.confessional_count ?? 0;
    if (current >= limit) {
      return { allowed: false, plan, limit, used: current, remaining: 0 };
    }

    const next = current + 1;
    await admin.from('ia_daily_usage').upsert(
      {
        user_id: userId,
        date,
        confessional_count: next,
        requests_count: row?.requests_count ?? 0,
        perspectives_count: row?.perspectives_count ?? 0,
      },
      { onConflict: 'user_id,date' }
    );

    return { allowed: true, plan, limit, used: next, remaining: Math.max(0, limit - next) };
  }

  return { allowed: true, plan: 'free', limit, used: 0, remaining: limit };
}
