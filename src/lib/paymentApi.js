import { API_BASE, parseApiResponse } from './apiClient.js';

export async function createPaymentCheckout({ planType, paymentMethod, accessToken }) {
  const res = await fetch(`${API_BASE}/api/payments/checkout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ planType, paymentMethod }),
  });
  return parseApiResponse(res);
}

export async function capturePayPalPayment({ orderId, paypalOrderId, accessToken }) {
  const res = await fetch(`${API_BASE}/api/payments/paypal/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId, paypalOrderId }),
  });
  return parseApiResponse(res);
}

export async function fetchPaymentOrder(orderId, accessToken) {
  const res = await fetch(`${API_BASE}/api/payments/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse(res);
}

export async function devCompletePayment({ orderId, secret, accessToken }) {
  const res = await fetch(`${API_BASE}/api/payments/dev/complete`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId, secret }),
  });
  return parseApiResponse(res);
}
