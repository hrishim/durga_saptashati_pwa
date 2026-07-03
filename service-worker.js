const CACHE_NAME = 'durga-saptashati-pwa-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './pwa.js',
  './service-worker.js',
  './favicon.svg',
  './icons.svg',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './assets/index-BZwTmOfZ.css',
  './assets/index-C-paQNup.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
