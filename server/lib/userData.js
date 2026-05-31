import { getSupabaseAdmin } from './supabaseAdmin.js';
import { listSessionMessages } from './confessionalService.js';
import { decryptConfessionalContent } from './confessionalCrypto.js';

export async function exportUserData(userId) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('supabase_admin_unavailable');

  const [profileRes, postsRes, usageRes, sessionsRes, companionReqRes, prayerRes, supportRes, supportMsgRes] =
    await Promise.all([
      admin.from('profiles').select('*').eq('id', userId).maybeSingle(),
      admin.from('community_posts').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      admin.from('ia_daily_usage').select('*').eq('user_id', userId),
      admin.from('confession_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      admin.from('companion_requests').select('*').eq('user_id', userId),
      admin.from('prayer_requests').select('*').eq('user_id', userId),
      admin.from('confessional_support_group_members').select('group_id, joined_at').eq('user_id', userId),
      admin
        .from('confessional_support_messages')
        .select('id, group_id, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

  let conversations = [];
  const convRes = await admin.from('ia_conversations').select('*').eq('user_id', userId);
  if (!convRes.error) conversations = convRes.data || [];

  const sessions = sessionsRes.data || [];
  const messagesBySession = {};
  for (const s of sessions.slice(0, 20)) {
    const rows = await listSessionMessages(userId, s.id);
    if (rows) messagesBySession[s.id] = rows;
  }

  return {
    exported_at: new Date().toISOString(),
    user_id: userId,
    profile: profileRes.data || null,
    community_posts: postsRes.data || [],
    ia_daily_usage: usageRes.data || [],
    ia_conversations: conversations,
    confession_sessions: sessions,
    confession_messages: messagesBySession,
    companion_requests: companionReqRes.data || [],
    prayer_requests: prayerRes.data || [],
    support_group_memberships: supportRes.data || [],
    support_circle_messages: (supportMsgRes.data || []).map((m) => ({
      id: m.id,
      group_id: m.group_id,
      created_at: m.created_at,
      content: decryptConfessionalContent(m.content, m.group_id),
    })),
  };
}

export async function deleteUserData(userId) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('supabase_admin_unavailable');

  const { data: userRequests } = await admin
    .from('companion_requests')
    .select('id')
    .eq('user_id', userId);
  const requestIds = (userRequests || []).map((r) => r.id);
  if (requestIds.length) {
    await admin.from('companion_chat_messages').delete().in('request_id', requestIds);
    await admin.from('companion_case_notes').delete().in('request_id', requestIds);
  }

  await admin.from('companion_requests').delete().eq('user_id', userId);
  await admin.from('companion_requests').delete().eq('assigned_companion_id', userId);
  await admin.from('companion_case_notes').delete().eq('companion_id', userId);
  await admin.from('companion_chat_messages').delete().eq('sender_id', userId);
  await admin.from('companion_push_subscriptions').delete().eq('user_id', userId);
  await admin.from('companion_applications').delete().eq('user_id', userId);

  await admin.from('confessional_support_messages').delete().eq('user_id', userId);
  await admin.from('confessional_support_group_members').delete().eq('user_id', userId);
  await admin.from('prayer_requests').delete().eq('user_id', userId);
  await admin.from('confession_crisis_events').delete().eq('user_id', userId);

  const { data: sessions } = await admin
    .from('confession_sessions')
    .select('id')
    .eq('user_id', userId);
  const sessionIds = (sessions || []).map((s) => s.id);
  if (sessionIds.length) {
    await admin.from('confession_messages').delete().in('session_id', sessionIds);
  }
  await admin.from('confession_sessions').delete().eq('user_id', userId);

  await admin.from('community_posts').delete().eq('user_id', userId);
  await admin.from('ia_daily_usage').delete().eq('user_id', userId);

  const convDel = await admin.from('ia_conversations').delete().eq('user_id', userId);
  if (convDel.error && !convDel.error.message?.includes('does not exist')) {
    console.warn('ia_conversations delete', convDel.error.message);
  }

  const perspDel = await admin.from('perspective_analyses').delete().eq('user_id', userId);
  if (perspDel.error && !perspDel.error.message?.includes('does not exist')) {
    console.warn('perspective_analyses delete', perspDel.error.message);
  }

  const { data: files } = await admin.storage.from('avatars').list(userId);
  if (files?.length) {
    const paths = files.map((f) => `${userId}/${f.name}`);
    await admin.storage.from('avatars').remove(paths);
  }

  await admin.from('profiles').delete().eq('id', userId);

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) throw authError;

  return { ok: true };
}
