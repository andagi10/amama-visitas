const CACHE = 'calendarios-v1';
const CORE = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (!url.startsWith('http') ||
      url.includes('supabase.co') ||
      url.includes('jsdelivr') ||
      url.includes('cdn.')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 408})));
    return;
  }
  e.respondWith(
    fetch(e.request, {cache: 'no-cache'})
      .then(response => {
        if (response && response.status === 200 && e.request.method === 'GET') {
          caches.open(CACHE).then(c => c.put(e.request, response.clone())).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
