// Registers the service worker at the app root so the station app can reopen with no signal.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${APP_ROOT}sw.js`).catch((err) => console.log('[SW] Not registered (open the app through http://localhost, not file://):', err));
  });
}
