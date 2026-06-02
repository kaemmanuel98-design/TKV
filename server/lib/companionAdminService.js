import { getSupabaseAdmin } from './supabaseAdmin.js';
import { config } from '../config.js';
import { sendTransactionalEmail } from './sendEmail.js';

function sanitizeLimit(limit, fallback = 60) {
  const n = Number(limit);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(200, Math.trunc(n)));
}

async function mapAuthUsers(userIds) {
  const admin = getSupabaseAdmin();
  const out = {};
  for (const id of userIds) {
    try {
      const { data } = await admin.auth.admin.getUserById(id);
      out[id] = data?.user || null;
    } catch {
      out[id] = null;
    }
  }
  return out;
}

async function safeInsertAuditLog(entry) {
  const admin = getSupabaseAdmin();
  try {
    await admin.from('companion_admin_audit_logs').insert(entry);
  } catch {
    // Keep admin actions functional even if SQL migration was not applied yet.
  }
}

async function findAuthUserByEmail(email) {
  const admin = getSupabaseAdmin();
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return null;
  let page = 1;
  const perPage = 200;
  while (page <= 25) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    const match = users.find((u) => String(u.email || '').toLowerCase() === normalized);
    if (match) return match;
    if (users.length < perPage) break;
    page += 1;
  }
  return null;
}

export async function listAdminCommunityPosts(limit = 60) {
  const admin = getSupabaseAdmin();
  const safeLimit = sanitizeLimit(limit, 60);
  const { data: posts, error } = await admin
    .from('community_posts')
    .select(
      'id, user_id, content, post_type, reactions_count, moderation_status, moderation_note, moderated_at, moderated_by, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(safeLimit);
  if (error) throw error;

  const userIds = [...new Set((posts || []).map((p) => p.user_id).filter(Boolean))];
  const [profilesRes, authMap] = await Promise.all([
    userIds.length
      ? admin.from('profiles').select('id, name').in('id', userIds)
      : Promise.resolve({ data: [], error: null }),
    mapAuthUsers(userIds),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  const profileMap = Object.fromEntries((profilesRes.data || []).map((p) => [p.id, p]));

  return (posts || []).map((p) => ({
    ...p,
    author_name: profileMap[p.user_id]?.name || null,
    author_email: authMap[p.user_id]?.email || null,
  }));
}

export async function moderateAdminCommunityPost(postId, status, note, adminUserId) {
  const admin = getSupabaseAdmin();
  const nextStatus = String(status || '').trim().toLowerCase();
  if (!['approved', 'rejected', 'pending'].includes(nextStatus)) {
    const err = new Error('invalid_status');
    err.code = 'invalid_status';
    throw err;
  }
  const safeNote = String(note || '').trim().slice(0, 400);
  const { data, error } = await admin
    .from('community_posts')
    .update({
      moderation_status: nextStatus,
      moderation_note: safeNote || null,
      moderated_by: adminUserId || null,
      moderated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .select('id, user_id, moderation_status, moderation_note, moderated_by, moderated_at')
    .maybeSingle();
  if (error) throw error;
  if (data) {
    await safeInsertAuditLog({
      admin_user_id: adminUserId,
      action_type: 'moderate_post',
      target_type: 'community_post',
      target_id: postId,
      details: {
        status: nextStatus,
        note: safeNote || null,
      },
    });
  }
  return data;
}

export async function deleteAdminCommunityPost(postId, adminUserId) {
  const admin = getSupabaseAdmin();
  const id = String(postId || '').trim();
  if (!id) return null;
  const { data: existing } = await admin
    .from('community_posts')
    .select('id, user_id, moderation_status')
    .eq('id', id)
    .maybeSingle();
  if (!existing) return null;

  const { error } = await admin.from('community_posts').delete().eq('id', id);
  if (error) throw error;

  await safeInsertAuditLog({
    admin_user_id: adminUserId || null,
    action_type: 'delete_post',
    target_type: 'community_post',
    target_id: id,
    details: {
      previous_status: existing.moderation_status || null,
      author_user_id: existing.user_id || null,
    },
  });
  return existing;
}

export async function listAdminRoleUsers(limit = 80, query = '') {
  const admin = getSupabaseAdmin();
  const safeLimit = sanitizeLimit(limit, 80);

  const [{ data: profiles, error: profilesError }, { data: appRows, error: appError }, { data: postRows, error: postError }] =
    await Promise.all([
      admin
        .from('profiles')
        .select(
          'id, name, is_confessional_companion, is_companion_moderator, is_companion_admin, is_companion_super_admin, companion_availability, can_host_visio, plan_type'
        )
        .order('name', { ascending: true })
        .limit(safeLimit),
      admin.from('companion_applications').select('user_id').order('created_at', { ascending: false }).limit(safeLimit),
      admin.from('community_posts').select('user_id').order('created_at', { ascending: false }).limit(safeLimit),
    ]);
  if (profilesError) throw profilesError;
  if (appError) throw appError;
  if (postError) throw postError;

  const map = new Map((profiles || []).map((p) => [p.id, p]));
  for (const row of appRows || []) {
    if (row.user_id && !map.has(row.user_id)) {
      map.set(row.user_id, {
        id: row.user_id,
        name: null,
        is_confessional_companion: false,
        is_companion_moderator: false,
        is_companion_admin: false,
        is_companion_super_admin: false,
        companion_availability: 'offline',
        can_host_visio: false,
        plan_type: 'free',
      });
    }
  }
  for (const row of postRows || []) {
    if (row.user_id && !map.has(row.user_id)) {
      map.set(row.user_id, {
        id: row.user_id,
        name: null,
        is_confessional_companion: false,
        is_companion_moderator: false,
        is_companion_admin: false,
        is_companion_super_admin: false,
        companion_availability: 'offline',
        can_host_visio: false,
        plan_type: 'free',
      });
    }
  }

  let users = Array.from(map.values()).slice(0, safeLimit);
  const authMap = await mapAuthUsers(users.map((u) => u.id));
  const q = String(query || '').trim().toLowerCase();
  if (q) {
    users = users.filter((u) => {
      const email = String(authMap[u.id]?.email || '').toLowerCase();
      const name = String(u.name || '').toLowerCase();
      return email.includes(q) || name.includes(q) || u.id.includes(q);
    });
  }
  return users.map((u) => ({
    ...u,
    email: authMap[u.id]?.email || null,
  }));
}

export async function patchAdminUserRoles(userId, payload, actor = {}) {
  const admin = getSupabaseAdmin();
  const adminUserId = actor?.adminUserId || null;
  const actorIsSuperAdmin = actor?.isSuperAdmin === true;
  if (!userId) {
    const err = new Error('invalid_user');
    err.code = 'invalid_user';
    throw err;
  }

  const { data: currentProfile } = await admin
    .from('profiles')
    .select('id, is_companion_super_admin')
    .eq('id', userId)
    .maybeSingle();
  if (!currentProfile) {
    const err = new Error('invalid_user');
    err.code = 'invalid_user';
    throw err;
  }

  const patch = {};
  if (typeof payload?.isConfessionalCompanion === 'boolean') {
    patch.is_confessional_companion = payload.isConfessionalCompanion;
    if (!payload.isConfessionalCompanion) {
      patch.companion_availability = 'offline';
      patch.is_companion_moderator = false;
      patch.is_companion_admin = false;
    }
  }
  if (typeof payload?.isCompanionModerator === 'boolean') {
    patch.is_companion_moderator = payload.isCompanionModerator;
    if (payload.isCompanionModerator) {
      patch.is_confessional_companion = true;
    }
  }
  if (typeof payload?.isCompanionAdmin === 'boolean') {
    if (!actorIsSuperAdmin) {
      const err = new Error('forbidden_admin_role');
      err.code = 'forbidden_admin_role';
      throw err;
    }
    if (adminUserId && userId === adminUserId && payload.isCompanionAdmin === false) {
      const err = new Error('self_admin_demotion_forbidden');
      err.code = 'self_admin_demotion_forbidden';
      throw err;
    }
    patch.is_companion_admin = payload.isCompanionAdmin;
    if (payload.isCompanionAdmin) {
      patch.is_companion_moderator = true;
      patch.is_confessional_companion = true;
    }
  }
  if (typeof payload?.isCompanionSuperAdmin === 'boolean') {
    if (!actorIsSuperAdmin) {
      const err = new Error('forbidden_super_admin_role');
      err.code = 'forbidden_super_admin_role';
      throw err;
    }
    if (payload.isCompanionSuperAdmin === false && currentProfile.is_companion_super_admin === true) {
      const { count } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_companion_super_admin', true);
      if ((count || 0) <= 1) {
        const err = new Error('last_super_admin_forbidden');
        err.code = 'last_super_admin_forbidden';
        throw err;
      }
    }
    patch.is_companion_super_admin = payload.isCompanionSuperAdmin;
    if (payload.isCompanionSuperAdmin) {
      patch.is_companion_admin = true;
      patch.is_companion_moderator = true;
      patch.is_confessional_companion = true;
    }
  }
  if (typeof payload?.canHostVisio === 'boolean') {
    patch.can_host_visio = payload.canHostVisio;
  }
  if (typeof payload?.planType === 'string') {
    const v = payload.planType.trim().toLowerCase();
    if (['free', 'premium', 'premium_plus'].includes(v)) {
      patch.plan_type = v;
    }
  }

  if (Object.keys(patch).length === 0) {
    const err = new Error('empty_patch');
    err.code = 'empty_patch';
    throw err;
  }

  const { data, error } = await admin
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select(
      'id, name, is_confessional_companion, is_companion_moderator, is_companion_admin, is_companion_super_admin, companion_availability, can_host_visio, plan_type'
    )
    .single();
  if (error) throw error;

  let email = null;
  try {
    const auth = await admin.auth.admin.getUserById(userId);
    email = auth?.data?.user?.email || null;
  } catch {
    email = null;
  }
  await safeInsertAuditLog({
    admin_user_id: adminUserId,
    action_type: 'update_user_roles',
    target_type: 'profile',
    target_id: userId,
    details: {
      patch,
    },
  });
  return { ...data, email };
}

export async function listAdminAuditLogs(limit = 80) {
  const admin = getSupabaseAdmin();
  const safeLimit = sanitizeLimit(limit, 80);
  const { data, error } = await admin
    .from('companion_admin_audit_logs')
    .select('id, admin_user_id, action_type, target_type, target_id, details, created_at')
    .order('created_at', { ascending: false })
    .limit(safeLimit);
  if (error) {
    // If migration not yet applied, fail softly.
    return [];
  }
  const rows = data || [];
  const ids = [...new Set(rows.map((r) => r.admin_user_id).filter(Boolean))];
  const authMap = await mapAuthUsers(ids);
  return rows.map((r) => ({
    ...r,
    admin_email: authMap[r.admin_user_id]?.email || null,
  }));
}

export async function patchAdminUserRolesByEmail(email, payload, actor = {}) {
  const admin = getSupabaseAdmin();
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    const err = new Error('invalid_email');
    err.code = 'invalid_email';
    throw err;
  }

  const authUser = await findAuthUserByEmail(normalized);
  if (!authUser?.id) {
    const err = new Error('user_not_found');
    err.code = 'user_not_found';
    throw err;
  }

  const { data: profile } = await admin.from('profiles').select('id').eq('id', authUser.id).maybeSingle();
  if (!profile) {
    await admin.from('profiles').insert({
      id: authUser.id,
      name: authUser.user_metadata?.name || normalized.split('@')[0] || 'TKV member',
    });
  }

  return patchAdminUserRoles(authUser.id, payload, actor);
}

export async function inviteAdminUserByEmail(email, role, actor = {}) {
  const admin = getSupabaseAdmin();
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    const err = new Error('invalid_email');
    err.code = 'invalid_email';
    throw err;
  }
  const allowedRoles = ['companion', 'moderator', 'admin', 'superadmin'];
  const safeRole = String(role || '').trim().toLowerCase();
  if (!allowedRoles.includes(safeRole)) {
    const err = new Error('invalid_role');
    err.code = 'invalid_role';
    throw err;
  }

  const existing = await findAuthUserByEmail(normalized);
  if (existing?.id) {
    const err = new Error('user_already_exists');
    err.code = 'user_already_exists';
    throw err;
  }

  const labels = {
    companion: 'Accompagnateur',
    moderator: 'Moderateur',
    admin: 'Administrateur',
    superadmin: 'Super-administrateur',
  };
  const roleLabel = labels[safeRole] || labels.companion;

  await admin
    .from('companion_role_invites')
    .delete()
    .eq('invitee_email', normalized)
    .eq('status', 'pending');
  await admin.from('companion_role_invites').insert({
    invitee_email: normalized,
    invited_role: safeRole,
    invited_by: actor?.adminUserId || null,
    status: 'pending',
  });

  const appUrl = config.appPublicUrl || 'https://www.thekingdomsvoice.com';
  const signupUrl = `${appUrl}/auth`;
  const subject = `[TKV] Invitation: role ${roleLabel}`;
  const html = `
    <p>Bonjour,</p>
    <p>Vous etes invite(e) a rejoindre TKV avec le role <strong>${roleLabel}</strong>.</p>
    <p>Inscrivez-vous avec cette adresse e-mail. Le role sera applique automatiquement a votre premiere connexion :</p>
    <p><a href="${signupUrl}">${signupUrl}</a></p>
    <p>Equipe TKV</p>
  `;
  const text = `Invitation TKV (${roleLabel}). Inscription: ${signupUrl}`;

  const mail = await sendTransactionalEmail({ to: normalized, subject, html, text });
  if (!mail?.ok && !mail?.skipped) {
    const err = new Error('invite_send_failed');
    err.code = 'invite_send_failed';
    throw err;
  }

  await safeInsertAuditLog({
    admin_user_id: actor?.adminUserId || null,
    action_type: 'invite_user',
    target_type: 'email',
    target_id: normalized,
    details: {
      role: safeRole,
      emailSent: Boolean(mail?.ok),
      emailSkipped: Boolean(mail?.skipped),
    },
  });

  return { ok: true, email: normalized, role: safeRole, emailSent: Boolean(mail?.ok), emailSkipped: Boolean(mail?.skipped) };
}

export async function applyPendingInviteForUser(userId, email) {
  const admin = getSupabaseAdmin();
  const normalized = String(email || '').trim().toLowerCase();
  if (!userId || !normalized) return null;

  const { data: invite, error } = await admin
    .from('companion_role_invites')
    .select('id, invited_role')
    .eq('invitee_email', normalized)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  if (!invite) return null;

  const patch = { is_confessional_companion: true };
  if (invite.invited_role === 'moderator') patch.is_companion_moderator = true;
  if (invite.invited_role === 'admin') {
    patch.is_companion_moderator = true;
    patch.is_companion_admin = true;
  }
  if (invite.invited_role === 'superadmin') {
    patch.is_companion_moderator = true;
    patch.is_companion_admin = true;
    patch.is_companion_super_admin = true;
  }

  await admin.from('profiles').update(patch).eq('id', userId);
  await admin
    .from('companion_role_invites')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_user_id: userId,
    })
    .eq('id', invite.id);
  await safeInsertAuditLog({
    admin_user_id: null,
    action_type: 'invite_auto_claim',
    target_type: 'profile',
    target_id: userId,
    details: { inviteId: invite.id, role: invite.invited_role, email: normalized },
  });
  const { data: profile } = await admin.from('profiles').select('*').eq('id', userId).maybeSingle();
  return profile || null;
}

export async function listPendingInvites(limit = 80) {
  const admin = getSupabaseAdmin();
  const safeLimit = sanitizeLimit(limit, 80);
  const { data, error } = await admin
    .from('companion_role_invites')
    .select('id, invitee_email, invited_role, invited_by, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(safeLimit);
  if (error) throw error;
  return data || [];
}

export async function cancelPendingInvite(inviteId, actor = {}) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('companion_role_invites')
    .update({ status: 'cancelled' })
    .eq('id', inviteId)
    .eq('status', 'pending')
    .select('id, invitee_email, invited_role, status')
    .maybeSingle();
  if (error) throw error;
  if (data) {
    await safeInsertAuditLog({
      admin_user_id: actor?.adminUserId || null,
      action_type: 'invite_cancelled',
      target_type: 'invite',
      target_id: inviteId,
      details: {
        email: data.invitee_email,
        role: data.invited_role,
      },
    });
  }
  return data;
}

export async function searchUsersByName(query, options = {}) {
  const admin = getSupabaseAdmin();
  const q = String(query || '').trim();
  if (q.length < 2) return [];
  const safeLimit = Math.max(1, Math.min(30, Number(options?.limit) || 12));
  const country = String(options?.country || '').trim();
  const availability = String(options?.availability || '').trim().toLowerCase();
  const sort = String(options?.sort || 'name_asc').trim().toLowerCase();

  let queryBuilder = admin
    .from('profiles')
    .select(
      'id, name, country, companion_availability, is_confessional_companion, is_companion_moderator, is_companion_admin, is_companion_super_admin'
    )
    .ilike('name', `%${q}%`)
    .limit(safeLimit);
  if (country) queryBuilder = queryBuilder.eq('country', country);
  if (['online', 'busy', 'offline'].includes(availability)) {
    queryBuilder = queryBuilder.eq('companion_availability', availability);
  }
  if (sort === 'availability') {
    queryBuilder = queryBuilder.order('companion_availability', { ascending: true }).order('name', { ascending: true });
  } else if (sort === 'recent') {
    queryBuilder = queryBuilder.order('id', { ascending: false });
  } else {
    queryBuilder = queryBuilder.order('name', { ascending: true });
  }

  const { data, error } = await queryBuilder;
  if (error) throw error;
  const rows = data || [];
  const authMap = await mapAuthUsers(rows.map((r) => r.id));
  return rows.map((r) => ({
    ...r,
    email: authMap[r.id]?.email || null,
  }));
}
