const CACHE_NAME = 'smart-metaverse-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }

            return fetch(event.request).then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch(() => {
                return caches.match('/index.html');
            });
        })
    );
});

self.addEventListener('activate', (event) => {
  const activation = (async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName !== CACHE_NAME) {
          return caches.delete(cacheName);
        }
      })
    );
    await self.clients.claim();
  })();

  event.waitUntil(activation);
});

self.addEventListener('push', function(event) {
    const title = 'SMART Metaverse';
    const options = {
        body: event.data.text(),
        icon: 'icon.png',
        badge: 'badge.png'
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('sync', function(event) {
    if (event.tag == 'sync-leaderboard') {
        event.waitUntil(syncLeaderboard());
    }
});

function syncLeaderboard() {
    // Implement your leaderboard sync logic here
}
