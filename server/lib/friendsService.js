import { getSupabaseAdmin } from './supabaseAdmin.js';

const OFFLINE_MS = 5 * 60 * 1000;

export async function getAcceptedFriendIds(admin, userId) {
  const { data, error } = await admin
    .from('friend_requests')
    .select('from_user_id, to_user_id')
    .eq('status', 'accepted')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

  if (error) throw error;
  return (data || []).map((row) =>
    row.from_user_id === userId ? row.to_user_id : row.from_user_id
  );
}

/**
 * Heartbeat présence : met à jour last_seen_at et émet un événement Realtime (alertes in-app uniquement).
 */
export async function recordFriendPresence(user) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('supabase_admin_unavailable');

  const now = new Date();
  const { data: profile, error: profErr } = await admin
    .from('profiles')
    .select('last_seen_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profErr) throw profErr;

  const lastSeen = profile?.last_seen_at ? new Date(profile.last_seen_at).getTime() : 0;
  const wasOffline = !lastSeen || now.getTime() - lastSeen > OFFLINE_MS;

  await admin
    .from('profiles')
    .update({
      last_seen_at: now.toISOString(),
      last_active_date: now.toISOString().slice(0, 10),
    })
    .eq('id', user.id);

  if (!wasOffline) {
    return { wentOnline: false };
  }

  const { error: evErr } = await admin.from('friend_presence_events').insert({
    user_id: user.id,
  });
  if (evErr) console.error('friend_presence_events insert', evErr);

  return { wentOnline: true };
}
