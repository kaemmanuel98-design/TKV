import { getSupabaseAdmin } from './supabaseAdmin.js';
import {
  decryptCompanionChatContent,
  encryptCompanionChatContent,
} from './confessionalCrypto.js';

const QUEUE_STATUSES = ['pending', 'assigned', 'in_progress'];

export async function listCompanionQueue(companionId) {
  const admin = getSupabaseAdmin();
  const { data: requests, error } = await admin
    .from('companion_requests')
    .select(
      'id, user_id, session_id, first_name, availability, message, situation, urgency, status, assigned_companion_id, created_at, updated_at'
    )
    .in('status', QUEUE_STATUSES)
    .order('urgency', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(80);
  if (error) throw error;

  const userIds = [...new Set((requests || []).map((r) => r.user_id).filter(Boolean))];
  let profiles = [];
  if (userIds.length) {
    const { data } = await admin.from('profiles').select('id, name, country').in('id', userIds);
    profiles = data || [];
  }
  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));

  const { data: crises } = await admin
    .from('confession_crisis_events')
    .select('session_id, crisis_level, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  const crisisBySession = {};
  for (const c of crises || []) {
    if (c.session_id && !crisisBySession[c.session_id]) {
      crisisBySession[c.session_id] = c;
    }
  }

  return (requests || []).map((r) => ({
    ...r,
    user_display: r.first_name || profileMap[r.user_id]?.name || '—',
    user_country: profileMap[r.user_id]?.country || null,
    mine: r.assigned_companion_id === companionId,
    unassigned: !r.assigned_companion_id,
    session_crisis: r.session_id ? crisisBySession[r.session_id] : null,
  }));
}

export async function getCompanionRequestDetail(requestId, companionId) {
  const admin = getSupabaseAdmin();
  const { data: req, error } = await admin
    .from('companion_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();
  if (error) throw error;
  if (!req) return null;
  if (req.assigned_companion_id && req.assigned_companion_id !== companionId) {
    const err = new Error('forbidden');
    err.code = 'forbidden';
    throw err;
  }

  const { data: notes } = await admin
    .from('companion_case_notes')
    .select('id, note_text, created_at')
    .eq('request_id', requestId)
    .eq('companion_id', companionId)
    .order('created_at', { ascending: false })
    .limit(40);

  const { data: profile } = await admin
    .from('profiles')
    .select('id, name, country')
    .eq('id', req.user_id)
    .maybeSingle();

  return {
    request: req,
    notes: notes || [],
    user_profile: profile,
  };
}

export async function assignCompanionRequest(requestId, companionId) {
  const admin = getSupabaseAdmin();
  const { data: existing } = await admin
    .from('companion_requests')
    .select('id, assigned_companion_id, status')
    .eq('id', requestId)
    .maybeSingle();
  if (!existing) return null;
  if (existing.assigned_companion_id && existing.assigned_companion_id !== companionId) {
    const err = new Error('already_assigned');
    err.code = 'already_assigned';
    throw err;
  }

  const { data, error } = await admin
    .from('companion_requests')
    .update({
      assigned_companion_id: companionId,
      status: 'assigned',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select('id, status, assigned_companion_id')
    .single();
  if (error) throw error;
  return data;
}

export async function updateCompanionRequestStatus(requestId, companionId, status) {
  const admin = getSupabaseAdmin();
  const allowed = ['assigned', 'in_progress', 'closed'];
  if (!allowed.includes(status)) {
    const err = new Error('invalid_status');
    err.code = 'invalid_status';
    throw err;
  }

  const { data: row } = await admin
    .from('companion_requests')
    .select('assigned_companion_id')
    .eq('id', requestId)
    .maybeSingle();
  if (!row || row.assigned_companion_id !== companionId) {
    const err = new Error('forbidden');
    err.code = 'forbidden';
    throw err;
  }

  const { data, error } = await admin
    .from('companion_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select('id, status')
    .single();
  if (error) throw error;
  return data;
}

export async function setCompanionAvailability(companionId, availability) {
  const admin = getSupabaseAdmin();
  const allowed = ['online', 'busy', 'offline'];
  if (!allowed.includes(availability)) {
    const err = new Error('invalid_availability');
    err.code = 'invalid_availability';
    throw err;
  }
  const { data, error } = await admin
    .from('profiles')
    .update({ companion_availability: availability })
    .eq('id', companionId)
    .select('companion_availability')
    .single();
  if (error) throw error;
  return data;
}

export async function addCompanionNote(requestId, companionId, noteText) {
  const admin = getSupabaseAdmin();
  const text = String(noteText || '').trim();
  if (!text || text.length > 4000) {
    const err = new Error('note_invalid');
    err.code = 'note_invalid';
    throw err;
  }

  const { data: row } = await admin
    .from('companion_requests')
    .select('assigned_companion_id')
    .eq('id', requestId)
    .maybeSingle();
  if (!row || row.assigned_companion_id !== companionId) {
    const err = new Error('forbidden');
    err.code = 'forbidden';
    throw err;
  }

  const { data, error } = await admin
    .from('companion_case_notes')
    .insert({ request_id: requestId, companion_id: companionId, note_text: text })
    .select('id, note_text, created_at')
    .single();
  if (error) throw error;
  return data;
}

export async function triggerCompanionEmergency(requestId, companionId) {
  const admin = getSupabaseAdmin();
  const { data: req } = await admin
    .from('companion_requests')
    .select('id, user_id, session_id, urgency, assigned_companion_id')
    .eq('id', requestId)
    .maybeSingle();
  if (!req || req.assigned_companion_id !== companionId) {
    const err = new Error('forbidden');
    err.code = 'forbidden';
    throw err;
  }

  await admin
    .from('companion_requests')
    .update({ urgency: true, status: 'in_progress', updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (req.session_id) {
    await admin.from('confession_crisis_events').insert({
      user_id: req.user_id,
      session_id: req.session_id,
      crisis_level: 'critical',
      keywords_detected: ['companion_emergency'],
      country_detected: null,
    });
  }

  return { ok: true, requestId };
}

export async function listCompanionChatMessages(requestId, readerId) {
  const admin = getSupabaseAdmin();
  const { data: req } = await admin
    .from('companion_requests')
    .select('user_id, assigned_companion_id')
    .eq('id', requestId)
    .maybeSingle();
  if (!req) return null;
  const isUser = req.user_id === readerId;
  const isCompanion = req.assigned_companion_id === readerId;
  if (!isUser && !isCompanion) {
    const err = new Error('forbidden');
    err.code = 'forbidden';
    throw err;
  }

  const { data, error } = await admin
    .from('companion_chat_messages')
    .select('id, sender_id, sender_role, content, created_at')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw error;

  return (data || []).map((m) => ({
    id: m.id,
    sender_id: m.sender_id,
    sender_role: m.sender_role,
    content: decryptCompanionChatContent(m.content, requestId),
    created_at: m.created_at,
  }));
}

export async function sendCompanionChatMessage(requestId, senderId, senderRole, text) {
  const admin = getSupabaseAdmin();
  const body = String(text || '').trim();
  if (!body || body.length > 2000) {
    const err = new Error('message_invalid');
    err.code = 'message_invalid';
    throw err;
  }

  const { data: req } = await admin
    .from('companion_requests')
    .select('user_id, assigned_companion_id, status')
    .eq('id', requestId)
    .maybeSingle();
  if (!req) return null;

  const roleOk =
    (senderRole === 'user' && req.user_id === senderId) ||
    (senderRole === 'companion' && req.assigned_companion_id === senderId);
  if (!roleOk || !['assigned', 'in_progress'].includes(req.status)) {
    const err = new Error('forbidden');
    err.code = 'forbidden';
    throw err;
  }

  const stored = encryptCompanionChatContent(body, requestId);
  const { data, error } = await admin
    .from('companion_chat_messages')
    .insert({
      request_id: requestId,
      sender_id: senderId,
      sender_role: senderRole,
      content: stored,
    })
    .select('id, sender_role, created_at')
    .single();
  if (error) throw error;
  return { ...data, content: body };
}

export async function listRecentCrisisEvents() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('confession_crisis_events')
    .select('id, user_id, session_id, crisis_level, keywords_detected, country_detected, created_at')
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}

export async function getCompanionMe(companionId) {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from('profiles')
    .select('id, name, companion_availability, is_confessional_companion')
    .eq('id', companionId)
    .maybeSingle();
  return data;
}

export async function listTeamCompanions(excludeId) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('profiles')
    .select('id, name, companion_availability')
    .eq('is_confessional_companion', true)
    .neq('id', excludeId)
    .order('name');
  if (error) throw error;
  return (data || []).filter((p) => p.id !== excludeId);
}

export async function transferCompanionRequest(requestId, fromCompanionId, toCompanionId) {
  const admin = getSupabaseAdmin();
  if (!toCompanionId || toCompanionId === fromCompanionId) {
    const err = new Error('invalid_target');
    err.code = 'invalid_target';
    throw err;
  }

  const { data: target } = await admin
    .from('profiles')
    .select('id, name, is_confessional_companion')
    .eq('id', toCompanionId)
    .maybeSingle();
  if (!target?.is_confessional_companion) {
    const err = new Error('invalid_target');
    err.code = 'invalid_target';
    throw err;
  }

  const { data: req } = await admin
    .from('companion_requests')
    .select('assigned_companion_id, status')
    .eq('id', requestId)
    .maybeSingle();
  if (!req || req.assigned_companion_id !== fromCompanionId) {
    const err = new Error('forbidden');
    err.code = 'forbidden';
    throw err;
  }
  if (!['assigned', 'in_progress'].includes(req.status)) {
    const err = new Error('invalid_status');
    err.code = 'invalid_status';
    throw err;
  }

  const { data, error } = await admin
    .from('companion_requests')
    .update({
      assigned_companion_id: toCompanionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select('id, assigned_companion_id')
    .single();
  if (error) throw error;

  const label = target.name || 'Accompagnateur';
  await admin.from('companion_case_notes').insert({
    request_id: requestId,
    companion_id: toCompanionId,
    note_text: `[Transfert] Dossier reçu de l'équipe accompagnateur. (${label})`,
  });

  return data;
}
