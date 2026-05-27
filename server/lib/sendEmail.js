import { config } from '../config.js';

/**
 * E-mail transactionnel via Resend (https://resend.com).
 * Si RESEND_API_KEY absent, l’envoi est ignoré (l’app in-app reste active).
 */
export async function sendTransactionalEmail({ to, subject, html, text }) {
  const { resendApiKey, emailFrom } = config;
  if (!resendApiKey || !emailFrom || !to) {
    return { ok: false, skipped: true, reason: 'email_not_configured' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [to],
      subject,
      html,
      text: text || undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('Resend error', res.status, body);
    return { ok: false, status: res.status, body };
  }

  const data = await res.json().catch(() => ({}));
  return { ok: true, id: data.id };
}
