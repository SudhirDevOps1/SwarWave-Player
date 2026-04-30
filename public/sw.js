const CACHE_NAME = 'privmitlab-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event
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

// ── Local CORS proxy via Service Worker ──────────────────
// Handles /__cors?url=<encoded> by fetching the URL and returning the response
const CORS_PREFIX = '/__cors?url=';
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const requestUrl = new URL(event.request.url);

  // Intercept /__cors?url=<target> requests
  if (requestUrl.pathname === '/__cors') {
    const target = requestUrl.searchParams.get('url');
    if (target) {
      event.respondWith(
        fetch(target, { headers: { Accept: 'application/json, text/html, */*' } })
          .then(async (res) => {
            const headers = new Headers(res.headers);
            headers.set('Access-Control-Allow-Origin', '*');
            headers.set('Access-Control-Allow-Methods', 'GET');
            return new Response(res.body, {
              status: res.status,
              statusText: res.statusText,
              headers,
            });
          })
          .catch((error) => {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 502,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
          })
      );
      return;
    }
  }

  // Default: cache-first for static assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
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
