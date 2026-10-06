// Service Worker: macht den Timer offline nutzbar (z. B. ohne WLAN in der Halle).
// Strategie "stale-while-revalidate": Antwort sofort aus dem Cache, im Hintergrund
// wird die aktuelle Version geladen und steht beim nächsten Öffnen bereit.
// Bei neuen/umbenannten Dateien FILES anpassen und CACHE hochzählen.
const CACHE = 'timer-v1';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Caches alter Versionen löschen
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request, { ignoreSearch: true });
      const update = fetch(e.request)
        .then((res) => {
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        })
        .catch(() => cached);
      if (cached) {
        // Hintergrund-Update am Leben halten, auch wenn die Antwort schon raus ist
        e.waitUntil(update);
        return cached;
      }
      return update;
    })
  );
});
