/**
 * Active Premium manuellement (secours si webhook Wave / PayPal en échec).
 * Usage : node scripts/mark-order-paid.mjs TKV-XXXXXX
 *         node scripts/mark-order-paid.mjs <uuid-commande>
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const arg = process.argv[2]?.trim();
if (!arg) {
  console.error('Usage: node scripts/mark-order-paid.mjs <reference_code|order_id>');
  process.exit(1);
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

const isUuid = /^[0-9a-f-]{36}$/i.test(arg);
const query = admin.from('subscription_orders').select('*');
const { data: order, error } = isUuid
  ? await query.eq('id', arg).maybeSingle()
  : await query.eq('reference_code', arg).maybeSingle();

if (error) {
  console.error('Erreur Supabase:', error.message);
  process.exit(1);
}
if (!order) {
  console.error('Commande introuvable:', arg);
  process.exit(1);
}
if (order.status === 'paid') {
  console.log('Déjà payée:', order.reference_code, order.id);
  process.exit(0);
}

const days = Number(process.env.PREMIUM_DURATION_DAYS) || 30;
const premiumUntil = new Date();
premiumUntil.setDate(premiumUntil.getDate() + days);
const paidAt = new Date().toISOString();

const { error: orderErr } = await admin
  .from('subscription_orders')
  .update({ status: 'paid', paid_at: paidAt })
  .eq('id', order.id);

if (orderErr) {
  console.error('Mise à jour commande:', orderErr.message);
  process.exit(1);
}

const { error: profileErr } = await admin
  .from('profiles')
  .update({
    is_premium: true,
    plan_type: order.plan_type,
    premium_until: premiumUntil.toISOString(),
  })
  .eq('id', order.user_id);

if (profileErr) {
  console.error('Mise à jour profil:', profileErr.message);
  process.exit(1);
}

console.log('OK — Premium activé');
console.log('  référence:', order.reference_code);
console.log('  plan:', order.plan_type);
console.log('  utilisateur:', order.user_id);
console.log('  jusqu’au:', premiumUntil.toISOString().slice(0, 10));
