import { getSupabaseAdmin } from './supabaseAdmin.js';

export async function exportUserData(userId) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('supabase_admin_unavailable');

  const [profileRes, postsRes, usageRes] = await Promise.all([
    admin.from('profiles').select('*').eq('id', userId).maybeSingle(),
    admin.from('community_posts').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    admin.from('ia_daily_usage').select('*').eq('user_id', userId),
  ]);

  let conversations = [];
  const convRes = await admin.from('ia_conversations').select('*').eq('user_id', userId);
  if (!convRes.error) conversations = convRes.data || [];

  return {
    exported_at: new Date().toISOString(),
    user_id: userId,
    profile: profileRes.data || null,
    community_posts: postsRes.data || [],
    ia_daily_usage: usageRes.data || [],
    ia_conversations: conversations,
  };
}

export async function deleteUserData(userId) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('supabase_admin_unavailable');

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
