import { API_BASE, parseApiResponse } from './apiClient.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Enregistre l’abonnement Web Push (accompagnateur, PWA installée ou onglet ouvert). */
export async function registerCompanionWebPush(accessToken) {
  if (!accessToken) return 'no_token';
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission;

  const registration = await navigator.serviceWorker.ready;
  const keyRes = await fetch(`${API_BASE}/api/companion/push/vapid-public-key`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (keyRes.status === 503) return 'not_configured';
  const { publicKey } = await parseApiResponse(keyRes);

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const subRes = await fetch(`${API_BASE}/api/companion/push/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
  await parseApiResponse(subRes);
  return 'registered';
}
