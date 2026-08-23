// Sahakar Gig Services PWA Service Worker
const CACHE_NAME = 'sahakar-gig-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/pwa-icon.svg',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Queue POST /api/jobs when offline via Background Sync pattern (localStorage fallback in client)
  if (event.request.url.includes('/api/') && event.request.method === 'POST' && event.request.url.includes('/jobs')) {
    event.respondWith(
      fetch(event.request.clone()).catch(async () => {
        const body = await event.request.clone().text();
        const clients = await self.clients.matchAll();
        clients.forEach(c => c.postMessage({ type: 'OFFLINE_JOB_QUEUED', body }));
        return new Response(JSON.stringify({ success: false, queued: true, message: 'Offline — job queued locally, will sync when back online (PWA)' }), { headers: { 'Content-Type': 'application/json' }, status: 202 });
      })
    );
    return;
  }
  if (event.request.url.includes('/api/')) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
