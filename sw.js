// Kenya Pro's League — Service Worker
const CACHE = 'kpl-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'Kenya Pro\'s League';
  const options = {
    body: data.body || 'New update from KPL',
    icon: 'trophy.png',
    badge: 'trophy.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open Site' },
      { action: 'close', title: 'Dismiss' }
    ]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if(e.action === 'close') return;
  e.waitUntil(
    clients.matchAll({type:'window'}).then(list => {
      for(const client of list){
        if(client.url.includes('kenya-pros-league') && 'focus' in client)
          return client.focus();
      }
      return clients.openWindow('https://okuku743.github.io/kenya-pros-league/index.html');
    })
  );
});
