// version 5

const CACHE_NAME = 'hwlog-cache-v3';
const ASSETS = [
  'manifest.json',
  'icon.svg'
];

// Install: cache static assets only
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for HTML, cache-first for static assets
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isHtml = url.pathname === '/' || url.pathname.endsWith('.html');

  if (isHtml) {
    // Always try network first for HTML
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else {
    // Static assets: cache-first, then network
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(networkResponse => {
          if (event.request.url.startsWith(self.location.origin)) {
            caches.open(CACHE_NAME).then(cache =>
              cache.put(event.request, networkResponse.clone())
            );
          }
          return networkResponse;
        });
      })
    );
  }
});