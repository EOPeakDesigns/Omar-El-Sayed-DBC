const CACHE_NAME = "premium-card-v4";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./styles/variables.css",
  "./styles/animations.css",
  "./styles/main.css",
  "./styles/responsive.css",
  "./scripts/app.js",
  "./scripts/deepLinks.js",
  "./scripts/qrHandler.js",
  "./scripts/videoHandler.js",
  "./scripts/vcardHandler.js",
  "./scripts/clipboard.js",
  "./scripts/animations.js",
  "./scripts/accessibility.js",
  "./scripts/pwa.js",
  "./data/card.json",
  "./assets/MYQR.png",
  "./assets/onwer.png",
  "./assets/images/cover-photography.svg",
  "./assets/images/profile-portrait.svg",
  "./assets/icons/favicon.svg",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/maskable-512.png",
  "./assets/icons/icon-source.svg",
  "./assets/icons/qr-badge.svg",
  "./assets/icons/social-preview.svg",
  "./assets/qr/qr-placeholder.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkRequest = fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => cachedResponse || caches.match("./index.html"));

      return cachedResponse || networkRequest;
    })
  );
});
