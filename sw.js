/* Pasaporte Gastronómico — modo sin conexión */
var VERSION   = 'pasaporte-v2';
var SHELL     = VERSION + '-shell';

var ESENCIALES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(SHELL).then(function (c) {
      return Promise.all(ESENCIALES.map(function (u) {
        return c.add(new Request(u, { mode: u.indexOf('http') === 0 ? 'cors' : 'same-origin' }))
                .catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) {
        if (k !== SHELL) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copia = res.clone();
          caches.open(SHELL).then(function (c) { c.put(req, copia).catch(function () {}); });
        }
        return res;
      }).catch(function () {
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
