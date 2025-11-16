const CACHE_NAME = 'minion-ai-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/icon.svg',
  // Note: assets from the importmap (react, etc.) are on a different origin (aistudiocdn.com)
  // and will be cached by the browser's regular HTTP cache, not the service worker, unless
  // we use a more complex strategy, which is not needed for a basic offline shell.
];

// On install, cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// On fetch, serve from cache first
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Not in cache, go to network
        return fetch(event.request);
      }
    )
  );
});

// Clean up old caches on activation
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
