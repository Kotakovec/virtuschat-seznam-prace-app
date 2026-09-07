const CACHE_NAME = 'todo-live-v1';

// Instalace: přeskočí čekání a hned se aktivuje
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Aktivace: smaže staré cache a převezme kontrolu nad všemi taby
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network First: dotaz jde vždy primárně na server/GitHub, do cache sahá jen při offline
self.addEventListener('fetch', (event) => {
  // Ignorovat Firebase volání (RTDB websocket a API)
  if (event.request.url.includes('firebaseio.com') || event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
