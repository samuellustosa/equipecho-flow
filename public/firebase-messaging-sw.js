const CACHE_NAME = 'equipecho-v1';
const urlsToCache = [
  '/',
  '/src/main.tsx',
  '/src/index.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Adicione a lógica para notificações push
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('Error parsing push data:', error);
    data = {};
  }
  
  const title = data.title || 'EquipCPD Notification';
  const options = {
    body: data.body || 'Você tem uma nova notificação.',
    icon: '/appstore.png',
    badge: '/196.png',
    tag: 'equipcpd-notification',
    requireInteraction: true,
    data: {
      url: data.url || '/'
    }
  };

  console.log('Showing notification:', title, options);

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notificationData = event.notification.data;
  if (notificationData.url) {
    event.waitUntil(
      clients.openWindow(notificationData.url)
    );
  }
});