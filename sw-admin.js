const ADMIN_STATIC_CACHE = "cat-hearth-admin-static-v1";
const ADMIN_RUNTIME_CACHE = "cat-hearth-admin-runtime-v1";
const ADMIN_MEDIA_CACHE = "cat-hearth-admin-media-v1";

const ADMIN_SHELL_FILES = [
  "./",
  "./index.html",
  "./admin.html",
  "./cats.html",
  "./categories.html",
  "./admin-shared.css",
  "./tailwind-theme.js",
  "./firebase.js",
  "./cloudinary.js",
  "./cats-manager.js",
  "./categories-manager.js",
  "./admin-dashboard.js",
  "./admin-login.js",
  "./efficiency-media.js",
  "./sw-register.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(ADMIN_STATIC_CACHE)
      .then((cache) => cache.addAll(ADMIN_SHELL_FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                ![
                  ADMIN_STATIC_CACHE,
                  ADMIN_RUNTIME_CACHE,
                  ADMIN_MEDIA_CACHE,
                ].includes(key),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, ADMIN_STATIC_CACHE));
    return;
  }

  if (isMediaRequest(request, url)) {
    event.respondWith(cacheFirst(request, ADMIN_MEDIA_CACHE));
    return;
  }

  if (isBypassRequest(url)) {
    return;
  }

  event.respondWith(staleWhileRevalidate(request, ADMIN_RUNTIME_CACHE));
});

function isBypassRequest(url) {
  return (
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("google-analytics.com") ||
    url.hostname.includes("analytics.google.com")
  );
}

function isMediaRequest(request, url) {
  const mediaDestinations = ["image", "video", "audio"];

  if (mediaDestinations.includes(request.destination)) {
    return true;
  }

  return (
    url.hostname.includes("res.cloudinary.com") ||
    /\.(png|jpg|jpeg|gif|webp|avif|svg|mp4|webm|ogg)$/i.test(url.pathname)
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const networkResponse = await fetch(request);
  cache.put(request, networkResponse.clone());
  return networkResponse;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (_error) {
    const cached = await cache.match(request);
    return cached || caches.match("./index.html");
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    return cached;
  }

  const networkResponse = await networkPromise;
  return (
    networkResponse ||
    new Response("", { status: 504, statusText: "Gateway Timeout" })
  );
}
