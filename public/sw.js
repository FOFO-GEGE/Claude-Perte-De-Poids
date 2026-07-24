// Ancienne PWA : ce service worker ne fait plus que se désinstaller proprement
// et vider les caches, pour les navigateurs qui ont encore l'ancien sw.js actif
// (stratégie network-first) suite à la migration vers Vite/Capacitor.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) client.navigate(client.url);
    })()
  );
});
