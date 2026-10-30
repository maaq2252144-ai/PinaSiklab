// Lets the station app reopen with no signal. Network first, so edits always show when online.
const CACHE = 'wl-station-v1';
const SHELL = [
  'station/index.php', 'assets/css/tokens.css', 'assets/css/components.css', 'assets/js/common.js',
  'assets/js/i18n-station.js', 'assets/js/station.js', 'assets/img/placeholder-logo.svg', 'assets/img/placeholder-photo.svg',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('fetch', (ev) => {
  const url = new URL(ev.request.url);
  if (ev.request.method !== 'GET' || url.pathname.includes('/api/') || url.origin !== location.origin) return;
  ev.respondWith(
    fetch(ev.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(ev.request, copy));
        return res;
      })
      .catch(() => caches.match(ev.request, { ignoreSearch: true }))
  );
});
