// Stratégie NETWORK-FIRST : la dernière version du code est toujours servie
// si le réseau répond. Le cache ne sert que de secours hors-ligne.
// => plus besoin de changer le numéro de version à chaque modification.
const CACHE = 'poids-runtime';
const SHELL = ['./', './index.html', './food-db.js', './manifest.json', './icon.svg'];
const OFF_HOST = 'world.openfoodfacts.org';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      // addAll échoue en bloc si un seul fichier manque : on met en cache un par un
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // API nutritionnelle : réseau uniquement, jamais de cache
  if (url.hostname === OFF_HOST) {
    e.respondWith(fetch(req).catch(() => Response.error()));
    return;
  }

  // Tout le reste : réseau d'abord, cache en secours
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200 && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(cached =>
          cached || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())
        )
      )
  );
});
