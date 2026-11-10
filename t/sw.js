// Moved to /takt/. This worker replaces the old one and removes itself.
// It leaves the cache alone: /takt/ shares it and cleans up old entries with its next version.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate('/takt/');
})()));
