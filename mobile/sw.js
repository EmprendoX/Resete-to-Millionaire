/* THE RESETE ORDER — Mobile PWA service worker */
const CACHE_VERSION = 'r2m-mobile-v2';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const AUDIO_CACHE = `${CACHE_VERSION}-audio`;

const SHELL_URLS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'audio-manifest.json',
  'locales/es.json',
  'locales/en.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  '../src/binauralPrograms.js',
  '../src/binauralAudioEngine.js',
  'icons/Logo_The_Resete_Order.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  const isAudio = url.pathname.endsWith('.mp3') || url.pathname.includes('/assets/audio/');
  const isFont = /fonts\.(googleapis|gstatic)\.com/.test(url.hostname);

  if (isFont) return;

  if (isAudio) {
    // Stale-while-revalidate for audio (large files)
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then((res) => {
            if (res && res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Shell: cache-first, fallback to network, update cache
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
