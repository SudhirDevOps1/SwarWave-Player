const CACHE_NAME = 'swarwave-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

// Install event — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event — remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event — network first, cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // Skip API calls from caching (Piped, Invidious, YouTube, Radio)
  const url = event.request.url;
  if (
    url.includes('pipedapi.') ||
    url.includes('api.piped.') ||
    url.includes('invidious.') ||
    url.includes('inv.') ||
    url.includes('iv.') ||
    url.includes('googleapis.com') ||
    url.includes('radio-browser.info') ||
    url.includes('allorigins.win') ||
    url.includes('corsproxy.io') ||
    url.includes('api.deezer.com') ||
    url.includes('youtube.com/results')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Keep-alive ping for background playback
let keepAliveInterval = null;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'KEEP_ALIVE_START') {
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    keepAliveInterval = setInterval(() => {
      self.registration.update();
    }, 20000);
  }
  
  if (event.data && event.data.type === 'KEEP_ALIVE_STOP') {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  }
});
