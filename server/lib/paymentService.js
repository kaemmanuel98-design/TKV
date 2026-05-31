import crypto from 'crypto';
import { config } from '../config.js';
import { getSupabaseAdmin } from './supabaseAdmin.js';
import { getPlanPricing, subscriptionDurationDays } from './paymentPlans.js';

function referenceCode() {
  return `TKV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

export async function createSubscriptionOrder({ userId, planType, paymentMethod, returnUrl, cancelUrl }) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('supabase_unavailable');

  const pricing = getPlanPricing(planType);
  const ref = referenceCode();

  const row = {
    user_id: userId,
    plan_type: pricing.planType,
    amount_cents: pricing.amountCents,
    currency: pricing.currency,
    payment_method: paymentMethod,
    status: 'pending',
    reference_code: ref,
    metadata: {},
  };

  const { data: order, error: insertError } = await admin
    .from('subscription_orders')
    .insert(row)
    .select()
    .single();
  if (insertError) throw insertError;

  const returnWithOrder = `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}order_id=${order.id}`;
  let checkoutUrl = null;
  let instructions = null;
  const updates = {};

  if (paymentMethod !== 'paypal') {
    throw new Error('invalid_payment_method');
  }

  const paypal = await createPayPalOrder({
    reference: ref,
    amount: pricing.paypalAmount,
    currency: pricing.paypalCurrency,
    returnUrl: returnWithOrder,
    cancelUrl,
  });
  updates.external_id = paypal.id;
  checkoutUrl = paypal.approvalUrl;
  updates.checkout_url = checkoutUrl;

  const { data: updated, error: updateError } = await admin
    .from('subscription_orders')
    .update(updates)
    .eq('id', order.id)
    .select()
    .single();
  if (updateError) throw updateError;

  return {
    order: updated,
    checkoutUrl,
    instructions,
    referenceCode: ref,
  };
}

export async function getOrderForUser(orderId, userId) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from('subscription_orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

export async function getOrderByReference(referenceCode) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from('subscription_orders')
    .select('*')
    .eq('reference_code', referenceCode)
    .maybeSingle();
  return data;
}

export async function markOrderPaid(order, { externalId } = {}) {
  if (!order || order.status === 'paid') return order;

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('supabase_unavailable');

  const paidAt = new Date().toISOString();
  const days = subscriptionDurationDays();
  const premiumUntil = new Date();
  premiumUntil.setDate(premiumUntil.getDate() + days);

  await admin
    .from('subscription_orders')
    .update({
      status: 'paid',
      paid_at: paidAt,
      external_id: externalId || order.external_id,
    })
    .eq('id', order.id);

  await admin
    .from('profiles')
    .update({
      is_premium: true,
      plan_type: order.plan_type,
      premium_until: premiumUntil.toISOString(),
    })
    .eq('id', order.user_id);

  return { ...order, status: 'paid', paid_at: paidAt };
}

export async function capturePayPalOrder(orderId, userId, paypalOrderId) {
  const order = await getOrderForUser(orderId, userId);
  if (!order) throw new Error('order_not_found');
  if (order.payment_method !== 'paypal') throw new Error('invalid_method');

  if (config.paypalClientId && config.paypalClientSecret) {
    await capturePayPalPayment(paypalOrderId || order.external_id);
  } else if (!config.paymentSandbox) {
    throw new Error('paypal_not_configured');
  }

  return markOrderPaid(order, { externalId: paypalOrderId || order.external_id });
}

/** Sandbox / admin : finalise une commande sans passerelle (dev uniquement). */
export async function devCompleteOrder(orderId, userId, secret) {
  if (!config.paymentSandbox || secret !== config.paymentDevSecret) {
    throw new Error('forbidden');
  }
  const order = await getOrderForUser(orderId, userId);
  if (!order) throw new Error('order_not_found');
  return markOrderPaid(order);
}

async function paypalAccessToken() {
  const auth = Buffer.from(`${config.paypalClientId}:${config.paypalClientSecret}`).toString('base64');
  const base = config.paypalSandbox
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('paypal_auth_failed');
  const json = await res.json();
  return json.access_token;
}

async function createPayPalOrder({ reference, amount, currency, returnUrl, cancelUrl }) {
  if (!config.paypalClientId || !config.paypalClientSecret) {
    if (config.paymentSandbox) {
      return {
        id: `SANDBOX-PAYPAL-${reference}`,
        approvalUrl: `${returnUrl}?sandbox=1&reference=${reference}`,
      };
    }
    throw new Error('paypal_not_configured');
  }

  const base = config.paypalSandbox
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
  const token = await paypalAccessToken();

  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: reference,
          amount: { currency_code: currency, value: amount },
          description: `TKV ${reference}`,
        },
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        brand_name: "The Kingdom's Voice",
        user_action: 'PAY_NOW',
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`paypal_create_failed: ${err}`);
  }

  const json = await res.json();
  const approve = json.links?.find((l) => l.rel === 'approve');
  return { id: json.id, approvalUrl: approve?.href };
}

async function capturePayPalPayment(paypalOrderId) {
  const base = config.paypalSandbox
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
  const token = await paypalAccessToken();
  const res = await fetch(`${base}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('paypal_capture_failed');
  return res.json();
}

async function createWaveCheckout({ reference, amount, currency, returnUrl }) {
  if (!config.waveApiKey) {
    if (config.paymentSandbox) {
      return {
        sessionId: `SANDBOX-WAVE-${reference}`,
        checkoutUrl: `${returnUrl}?sandbox=1&reference=${reference}&provider=wave`,
        instructions: null,
      };
    }
    return {
      sessionId: null,
      checkoutUrl: null,
      instructions: {
        message: 'Wave non configuré — configurez WAVE_API_KEY ou contactez le support TKV.',
        reference,
        amount,
        currency,
      },
    };
  }

  const res = await fetch('https://api.wave.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.waveApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: String(amount),
      currency,
      client_reference: reference,
      success_url: returnUrl,
      error_url: returnUrl.replace('success', 'cancel') || returnUrl,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`wave_create_failed: ${text}`);
  }

  const json = await res.json();
  return {
    sessionId: json.id,
    checkoutUrl: json.wave_launch_url || json.checkout_url || json.url,
    instructions: null,
  };
}

/** Vérifie le secret partagé Wave (en-tête Authorization: Bearer). */
export function verifyWaveWebhookAuth(authorizationHeader) {
  if (!config.waveWebhookSecret) return false;
  const token = String(authorizationHeader || '')
    .replace(/^Bearer\s+/i, '')
    .trim();
  return token.length > 0 && token === config.waveWebhookSecret;
}

export async function handleWaveWebhook(body) {
  const eventType = body?.type;
  if (eventType && eventType !== 'checkout.session.completed') {
    return null;
  }

  const status = body?.data?.payment_status || body?.payment_status;
  const reference = body?.data?.client_reference || body?.client_reference;
  if (!reference) return null;
  if (status !== 'succeeded' && status !== 'completed') return null;

  const order = await getOrderByReference(reference);
  if (!order) return null;
  if (order.status === 'paid') return order;
  return markOrderPaid(order, { externalId: body?.data?.id || body?.data?.transaction_id });
}
