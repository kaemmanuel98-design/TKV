import { createHash } from 'crypto';
import { getSupabaseAdmin } from './supabaseAdmin.js';
import {
  decryptConfessionalContent,
  encryptConfessionalContent,
} from './confessionalCrypto.js';

const MAX_MESSAGE_LEN = 800;
const MAX_MESSAGES_PER_HOUR = 40;

export function supportMemberCode(userId, groupId) {
  const hex = createHash('sha256').update(`${userId}:${groupId}`).digest('hex').slice(0, 6);
  return (parseInt(hex, 16) % 8999) + 1000;
}

async function assertGroupMember(admin, userId, groupId) {
  const { data } = await admin
    .from('confessional_support_group_members')
    .select('group_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) {
    const err = new Error('not_member');
    err.code = 'not_member';
    throw err;
  }
}

export async function listSupportGroups(userId, language = 'fr') {
  const admin = getSupabaseAdmin();
  const lang = language?.split('-')[0] || 'fr';

  const { data: groups, error } = await admin
    .from('confessional_support_groups')
    .select('id, situation, title, description, language')
    .eq('is_open', true)
    .eq('language', lang)
    .order('title');
  if (error) throw error;

  const ids = (groups || []).map((g) => g.id);
  if (!ids.length) return [];

  const { data: counts } = await admin
    .from('confessional_support_group_members')
    .select('group_id')
    .in('group_id', ids);

  const countMap = {};
  for (const row of counts || []) {
    countMap[row.group_id] = (countMap[row.group_id] || 0) + 1;
  }

  let myMemberships = [];
  if (userId) {
    const { data: mine } = await admin
      .from('confessional_support_group_members')
      .select('group_id')
      .eq('user_id', userId)
      .in('group_id', ids);
    myMemberships = (mine || []).map((m) => m.group_id);
  }

  return (groups || []).map((g) => ({
    ...g,
    member_count: countMap[g.id] || 0,
    joined: myMemberships.includes(g.id),
  }));
}

export async function joinSupportGroup(userId, groupId) {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('confessional_support_group_members').insert({
    group_id: groupId,
    user_id: userId,
  });
  if (error) {
    if (error.code === '23505') return { ok: true, already: true };
    throw error;
  }
  return { ok: true };
}

export async function leaveSupportGroup(userId, groupId) {
  const admin = getSupabaseAdmin();
  await admin
    .from('confessional_support_group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  return { ok: true };
}

export async function listSupportGroupMessages(userId, groupId) {
  const admin = getSupabaseAdmin();
  await assertGroupMember(admin, userId, groupId);

  const { data, error } = await admin
    .from('confessional_support_messages')
    .select('id, user_id, content, created_at')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
    .limit(120);
  if (error) throw error;

  return (data || []).map((m) => ({
    id: m.id,
    member_code: supportMemberCode(m.user_id, groupId),
    is_mine: m.user_id === userId,
    content: decryptConfessionalContent(m.content, groupId),
    created_at: m.created_at,
  }));
}

export async function postSupportGroupMessage(userId, groupId, text) {
  const admin = getSupabaseAdmin();
  const body = String(text || '').trim();
  if (!body || body.length > MAX_MESSAGE_LEN) {
    const err = new Error('message_invalid');
    err.code = 'message_invalid';
    throw err;
  }

  await assertGroupMember(admin, userId, groupId);

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from('confessional_support_messages')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .gte('created_at', since);
  if ((count ?? 0) >= MAX_MESSAGES_PER_HOUR) {
    const err = new Error('rate_limit');
    err.code = 'rate_limit';
    throw err;
  }

  const stored = encryptConfessionalContent(body, groupId);
  const { data, error } = await admin
    .from('confessional_support_messages')
    .insert({ group_id: groupId, user_id: userId, content: stored })
    .select('id, created_at')
    .single();
  if (error) throw error;

  return {
    id: data.id,
    member_code: supportMemberCode(userId, groupId),
    is_mine: true,
    content: body,
    created_at: data.created_at,
  };
}
