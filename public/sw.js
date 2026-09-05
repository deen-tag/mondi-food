// Service Worker minimal : uniquement pour les notifications push de l'admin.
// Tourne en arrière-plan, indépendamment de l'onglet, c'est ce qui permet de
// recevoir les notifs même navigateur/onglet fermé.

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}

  const title = data.title || 'Nouvelle commande';
  const options = {
    body: data.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'mondi-new-order',
    renotify: true,
    data: { url: '/admin.html' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Au clic sur la notif : ramène l'onglet admin au premier plan s'il existe déjà,
// sinon en ouvre un nouveau.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/admin.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes('admin.html') && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
