import { PLAN_LIMITS } from '../config.js';
import { getSupabaseAdmin, getUserProfile } from './supabaseAdmin.js';
import { enrichProfileWithFounderAccess } from './founderAccess.js';
import { premiumUsageResult } from './premiumAccess.js';

const memoryUsage = new Map();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function memoryKey(userId, req) {
  if (userId) return `${userId}:${todayKey()}`;
  const forwarded = req?.headers?.['x-forwarded-for'];
  const ip =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req?.socket?.remoteAddress || 'guest';
  return `guest:${ip}:${todayKey()}`;
}

export function resolvePlan(profile) {
  return isPremiumProfile(profile) ? 'premium' : 'free';
}

export async function getDailyUsage(userId, req = null) {
  const rawProfile = userId ? await getUserProfile(userId) : null;
  const profile = enrichProfileWithFounderAccess(rawProfile, req?.user?.email);
  const plan = resolvePlan(profile);
  if (plan === 'premium') {
    return {
      plan,
      chat: { used: 0, limit: null, remaining: null, unlimited: true },
      perspectives: { used: 0, limit: null, remaining: null, unlimited: true },
    };
  }

  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const admin = getSupabaseAdmin();
  const date = todayKey();

  if (admin && userId) {
    const { data: row } = await admin
      .from('ia_daily_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();

    return {
      plan,
      chat: {
        used: row?.requests_count ?? 0,
        limit: limits.chat,
        remaining: Math.max(0, limits.chat - (row?.requests_count ?? 0)),
      },
      perspectives: {
        used: row?.perspectives_count ?? 0,
        limit: limits.perspectives,
        remaining: Math.max(0, limits.perspectives - (row?.perspectives_count ?? 0)),
      },
    };
  }

  const key = memoryKey(userId, req);
  const usage = memoryUsage.get(key) || { chat: 0, perspectives: 0 };
  return {
    plan,
    chat: { used: usage.chat, limit: limits.chat, remaining: Math.max(0, limits.chat - usage.chat) },
    perspectives: {
      used: usage.perspectives,
      limit: limits.perspectives,
      remaining: Math.max(0, limits.perspectives - usage.perspectives),
    },
  };
}

export async function checkAndIncrementUsage(userId, type = 'chat', req = null) {
  const rawProfile = userId ? await getUserProfile(userId) : null;
  const profile = enrichProfileWithFounderAccess(rawProfile, req?.user?.email);
  const plan = resolvePlan(profile);
  if (plan === 'premium') {
    return premiumUsageResult(plan);
  }

  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const limit = type === 'perspectives' ? limits.perspectives : limits.chat;
  const admin = getSupabaseAdmin();

  if (admin && userId) {
    const date = todayKey();
    const col = type === 'perspectives' ? 'perspectives_count' : 'requests_count';

    const { data: row } = await admin
      .from('ia_daily_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();

    const current = row?.[col] ?? 0;
    if (current >= limit) {
      return { allowed: false, plan, limit, used: current, remaining: 0 };
    }

    const next = current + 1;
    const payload = {
      user_id: userId,
      date,
      requests_count: row?.requests_count ?? 0,
      perspectives_count: row?.perspectives_count ?? 0,
    };
    payload[col] = next;

    await admin.from('ia_daily_usage').upsert(payload, { onConflict: 'user_id,date' });

    return { allowed: true, plan, limit, used: next, remaining: Math.max(0, limit - next) };
  }

  const key = memoryKey(userId, req);
  const usage = memoryUsage.get(key) || { chat: 0, perspectives: 0 };
  const used = usage[type] ?? 0;
  if (used >= limit) {
    return { allowed: false, plan, limit, used, remaining: 0 };
  }
  usage[type] = used + 1;
  memoryUsage.set(key, usage);
  return { allowed: true, plan, limit, used: usage[type], remaining: limit - usage[type] };
}
