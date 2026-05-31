/* eslint-disable no-restricted-globals */
/** Handlers Web Push — importé par le service worker PWA (workbox). */
self.addEventListener('push', (event) => {
  let data = { title: 'TKV', body: '', url: '/' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    data.body = event.data?.text() || data.body;
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'TKV', {
      body: data.body || '',
      tag: data.tag || 'tkv-push',
      data: { url: data.url || '/' },
      icon: '/pwa-192x192.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || '/companion';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
      return undefined;
    })
  );
});
