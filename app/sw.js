// Lets the station app reopen with no signal. Network first, so edits always show when online.
// Bump CACHE whenever a file in SHELL changes name or location.
const CACHE = 'wl-static-v1';
const SHELL = [
  './', './index.html', './offline.html', './manifest.json',
  './pages/station/dashboard.html', './pages/supplier/dashboard.html',
  './assets/css/tokens.css', './assets/css/components.css',
  './assets/images/logo.png', './assets/images/placeholder-photo.svg',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png',
  './js/app.js', './js/core/utils.js', './js/services/local-db.js', './js/services/api.js', './js/services/sw-register.js',
  './pages/demo/dashboard.html', './js/features/demo.js', './assets/icons/icon-maskable-192.png', './assets/icons/icon-maskable-512.png',
  './js/features/station-i18n.js', './js/features/station.js',
  './js/features/supplier-i18n.js', './js/features/supplier.js',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (ev) => {
  const url = new URL(ev.request.url);
  if (ev.request.method !== 'GET' || url.pathname.includes('/api/') || url.origin !== location.origin) return;
  ev.respondWith(
    fetch(ev.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(ev.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(ev.request, { ignoreSearch: true })
        .then((hit) => hit || (ev.request.mode === 'navigate' ? caches.match('./offline.html') : Response.error())))
  );
});
