/* =============================================
   WakeProof — Service Worker
   Handles offline caching & background sync
============================================= */

const CACHE_NAME = 'wakeproof-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './manifest.json',
];

/* ---- Install: cache core files ---- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[SW] Cache install partial fail:', err);
      });
    })
  );
  self.skipWaiting();
});

/* ---- Activate: clean old caches ---- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ---- Fetch: serve from cache, fall back to network ---- */
self.addEventListener('fetch', event => {
  // Only cache GET requests for our own origin
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

/* ---- Push notifications (for alarm firing in background) ---- */
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title   = data.title   || '⏰ WakeProof Alarm';
  const options = {
    body:    data.body    || 'Time to wake up! Open WakeProof to dismiss.',
    icon:    './assets/icon-192.png',
    badge:   './assets/icon-192.png',
    vibrate: [500, 300, 500, 300, 500],
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Open App' }
    ],
    data: { url: self.registration.scope }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow(self.registration.scope);
    })
  );
});
