import { config } from '../config.js';
import { getSupabaseAdmin } from './supabaseAdmin.js';
import { sendTransactionalEmail } from './sendEmail.js';

export function isCompanionAdmin(user) {
  const email = (user?.email || '').toLowerCase();
  return Boolean(email && config.companionEmails.includes(email));
}

export async function getOwnCompanionApplication(userId) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('companion_applications')
    .select('id, status, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function submitCompanionApplication(userId, body) {
  const admin = getSupabaseAdmin();
  const motivation = String(body?.motivation || '').trim();
  const experience = String(body?.experience || '').trim().slice(0, 1200);
  const churchAffiliation = String(body?.churchAffiliation || '').trim().slice(0, 200);
  const charterAccepted = body?.charterAccepted === true;

  if (!motivation || motivation.length < 40) {
    const err = new Error('motivation_too_short');
    err.code = 'motivation_too_short';
    throw err;
  }
  if (!charterAccepted) {
    const err = new Error('charter_required');
    err.code = 'charter_required';
    throw err;
  }

  const existing = await getOwnCompanionApplication(userId);
  if (existing && existing.status !== 'rejected') {
    const err = new Error('already_applied');
    err.code = 'already_applied';
    throw err;
  }

  const row = {
    user_id: userId,
    motivation,
    experience: experience || null,
    church_affiliation: churchAffiliation || null,
    charter_accepted: true,
    status: 'pending',
    updated_at: new Date().toISOString(),
  };

  let data;
  if (existing?.status === 'rejected') {
    const { data: updated, error } = await admin
      .from('companion_applications')
      .update(row)
      .eq('user_id', userId)
      .select('id, status, created_at')
      .single();
    if (error) throw error;
    data = updated;
  } else {
    const { data: inserted, error } = await admin
      .from('companion_applications')
      .insert(row)
      .select('id, status, created_at')
      .single();
    if (error) {
      if (error.code === '23505') {
        const err = new Error('already_applied');
        err.code = 'already_applied';
        throw err;
      }
      throw error;
    }
    data = inserted;
  }

  await notifyAdminsNewApplication(userId, motivation);
  return data;
}

async function notifyAdminsNewApplication(userId, motivationPreview) {
  const emails = config.companionEmails || [];
  if (!emails.length) return;

  const admin = getSupabaseAdmin();
  let applicantEmail = '—';
  try {
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    applicantEmail = authUser?.user?.email || applicantEmail;
  } catch {
    /* ignore */
  }

  const appUrl = config.appPublicUrl || 'https://www.thekingdomsvoice.com';
  const subject = '[TKV] Nouvelle candidature accompagnateur';
  const html = `
    <p>Une candidature accompagnateur Confessionnal a été déposée.</p>
    <p><strong>E-mail :</strong> ${applicantEmail}</p>
    <p><strong>Motivation (extrait) :</strong></p>
    <blockquote>${String(motivationPreview).slice(0, 400).replace(/</g, '&lt;')}</blockquote>
    <p><a href="${appUrl}/companion">Ouvrir le tableau de bord</a></p>
  `;

  for (const to of emails) {
    await sendTransactionalEmail({ to, subject, html, text: subject });
  }
}

export async function listCompanionApplicationsForAdmin() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('companion_applications')
    .select(
      'id, user_id, motivation, experience, church_affiliation, status, created_at, updated_at'
    )
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;

  const rows = data || [];
  const enriched = [];
  for (const row of rows) {
    let email = null;
    let name = null;
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(row.user_id);
      email = authUser?.user?.email || null;
      name = authUser?.user?.user_metadata?.name || null;
    } catch {
      /* ignore */
    }
    enriched.push({ ...row, applicant_email: email, applicant_name: name });
  }
  return enriched;
}

export async function patchCompanionApplicationStatus(applicationId, status) {
  const allowed = ['pending', 'reviewing', 'approved', 'rejected'];
  if (!allowed.includes(status)) {
    const err = new Error('status_invalid');
    err.code = 'status_invalid';
    throw err;
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('companion_applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', applicationId)
    .select('id, user_id, status')
    .single();
  if (error) throw error;

  if (status === 'approved' && data?.user_id) {
    await admin
      .from('profiles')
      .update({ is_confessional_companion: true })
      .eq('id', data.user_id);
  }

  return data;
}
