// Offline cache. Bump VERSION with every change so phones pick up the new files.
const VERSION = 'takt-17';
const FILES = ['./', 'index.html', 'app.js', 'food.js', 'sync.js', 'ui.js', 'style.css', 'takt.webmanifest', 'takt-icon.svg', 'takt-icon-192.png', 'takt-icon-512.png',
  'fonts/unbounded-latin-500-normal.woff2', 'fonts/unbounded-latin-700-normal.woff2', 'fonts/manrope-latin-400-normal.woff2', 'fonts/manrope-latin-600-normal.woff2', 'fonts/manrope-latin-700-normal.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Cache first: the app has to open in the gym without signal.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
