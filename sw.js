const CACHE_NAME = 'todo-live-v1';

// Instalace - nečekej na zavření starých oken, hned aktivuj
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Aktivace - převezmi kontrolu nad všemi otevřenými taby hned
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

// Network First: Vždycky zkus nejprve GitHub po síti. Cache použij jen když je mobil offline.
self.addEventListener('fetch', (event) => {
  // Ignoruj Firebase požadavky (ty se řídí samy)
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
        // Pokud není internet, vezmi to z cache
        return caches.match(event.request);
      })
  );
});
