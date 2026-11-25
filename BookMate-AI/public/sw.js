/**
 * BookMate AI Service Worker
 * App-shell caching + offline catalog fallback
 */

const CACHE_NAME = 'bookmate-ai-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/src/style.css',
  '/src/main.js',
  '/src/curriculum.js',
  '/src/book-reader.js',
  '/src/ai-assistant.js',
  '/data/curriculum.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for curriculum.json (to detect updates)
  if (url.pathname.endsWith('curriculum.json')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for app shell and static assets
  if (request.method === 'GET' && (url.origin === self.location.origin)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          // Cache successful same-origin responses
          if (res.ok && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        }).catch(() => {
          // Offline fallback for navigation
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
    );
  }
});
