import { config } from '../config.js';
import { getSupabaseAdmin } from './supabaseAdmin.js';
import { sendTransactionalEmail } from './sendEmail.js';
import { sendCrisisWebPushToCompanions } from './companionWebPush.js';

/** Alerte e-mail aux accompagnateurs actifs (Resend optionnel). */
export async function notifyCompanionsCrisis({ level, situation, sessionId }) {
  if (level !== 'critical' && level !== 'high') return { sent: 0, skipped: true };

  const admin = getSupabaseAdmin();
  if (!admin) return { sent: 0, skipped: true };

  const emails = new Set(config.companionEmails || []);

  const { data: profiles } = await admin
    .from('profiles')
    .select('id')
    .eq('is_confessional_companion', true)
    .limit(40);

  for (const p of profiles || []) {
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(p.id);
      const email = authUser?.user?.email?.toLowerCase();
      if (email) emails.add(email);
    } catch {
      /* ignore */
    }
  }

  if (!emails.size) return { sent: 0, skipped: true, reason: 'no_companion_emails' };

  const appUrl = config.appPublicUrl || 'https://www.thekingdomsvoice.com';
  const subject =
    level === 'critical'
      ? '[TKV Confessionnal] Alerte crise — intervention urgente'
      : '[TKV Confessionnal] Alerte situation lourde';
  const html = `
    <p>Une personne vient de déclencher une alerte dans le Confessionnal TKV.</p>
    <ul>
      <li><strong>Niveau :</strong> ${level}</li>
      <li><strong>Situation :</strong> ${situation || '—'}</li>
      <li><strong>Session :</strong> ${sessionId || '—'}</li>
    </ul>
    <p><a href="${appUrl}/companion">Ouvrir le tableau de bord accompagnateur</a></p>
    <p style="color:#666;font-size:12px;">Aucun contenu de message n'est inclus (confidentialité CdC).</p>
  `;

  let sent = 0;
  for (const to of emails) {
    const r = await sendTransactionalEmail({ to, subject, html, text: subject });
    if (r.ok) sent += 1;
  }

  const push = await sendCrisisWebPushToCompanions({ level, situation });
  return { emailSent: sent, pushSent: push.sent ?? 0 };
}
