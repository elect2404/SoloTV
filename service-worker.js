// Development Service Worker - No cache to avoid caching issues during testing
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  // Pass-through without caching
  e.respondWith(fetch(e.request));
});
