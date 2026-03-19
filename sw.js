const CACHE = 'amama-v3';
const CORE = ['./index.html', './manifest.json'];

// Install: cache core files
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting(); // activate immediately
});

// Activate: delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // take control of all tabs immediately
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Skip non-http and third-party requests (supabase, CDN, chrome-extension)
  if (!url.startsWith('http') ||
      url.includes('supabase.co') ||
      url.includes('jsdelivr') ||
      url.includes('cdn.')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 408})));
    return;
  }

  // Network first, update cache, fallback to cache
  // This ensures every open gets the latest version if online
  e.respondWith(
    fetch(e.request, {cache: 'no-cache'})
      .then(response => {
        if (response && response.status === 200 && e.request.method === 'GET') {
          caches.open(CACHE).then(c => c.put(e.request, response.clone())).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(e.request)) // offline fallback
  );
});
