import webpush from 'web-push';
import { config } from '../config.js';
import { getSupabaseAdmin } from './supabaseAdmin.js';

let configured = false;

function ensureWebPush() {
  if (configured) return Boolean(config.vapidPublicKey && config.vapidPrivateKey);
  if (!config.vapidPublicKey || !config.vapidPrivateKey) return false;
  webpush.setVapidDetails(
    config.vapidSubject,
    config.vapidPublicKey,
    config.vapidPrivateKey
  );
  configured = true;
  return true;
}

export function webPushConfigured() {
  return Boolean(config.vapidPublicKey && config.vapidPrivateKey);
}

export function getVapidPublicKey() {
  return config.vapidPublicKey || null;
}

export async function upsertCompanionPushSubscription(userId, subscription) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('supabase_admin_unavailable');

  const endpoint = subscription?.endpoint;
  const keys = subscription?.keys;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    const err = new Error('subscription_invalid');
    err.code = 'subscription_invalid';
    throw err;
  }

  const { error } = await admin.from('companion_push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint,
      p256dh: keys.p256dh,
      auth_key: keys.auth,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  );
  if (error) throw error;
  return { ok: true };
}

export async function removeCompanionPushSubscription(userId, endpoint) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: true };
  await admin
    .from('companion_push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint);
  return { ok: true };
}

export async function sendCrisisWebPushToCompanions({ level, situation }) {
  if (!ensureWebPush()) return { sent: 0, skipped: true, reason: 'vapid_not_configured' };

  const admin = getSupabaseAdmin();
  if (!admin) return { sent: 0, skipped: true };

  const { data: companions } = await admin
    .from('profiles')
    .select('id')
    .eq('is_confessional_companion', true)
    .limit(80);

  const ids = (companions || []).map((p) => p.id);
  if (!ids.length) return { sent: 0, skipped: true, reason: 'no_companions' };

  const { data: subs } = await admin
    .from('companion_push_subscriptions')
    .select('endpoint, p256dh, auth_key, user_id')
    .in('user_id', ids);

  if (!subs?.length) return { sent: 0, skipped: true, reason: 'no_subscriptions' };

  const appUrl = config.appPublicUrl || 'https://www.thekingdomsvoice.com';
  const title =
    level === 'critical'
      ? 'TKV — Alerte crise Confessionnal'
      : 'TKV — Situation lourde Confessionnal';
  const body = `Niveau ${level}${situation ? ` · ${situation}` : ''}. Ouvrez le tableau de bord.`;
  const payload = JSON.stringify({
    title,
    body,
    url: `${appUrl}/companion`,
    tag: `tkv-crisis-${Date.now()}`,
  });

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth_key },
        },
        payload
      );
      sent += 1;
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await admin.from('companion_push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
    }
  }
  return { sent };
}
