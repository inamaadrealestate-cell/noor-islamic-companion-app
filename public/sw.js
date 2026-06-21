const CACHE_NAME = "noorquran-shell-v6-offline-core";
const CONTENT_CACHE_NAME = "noorquran-content-v6-offline-core";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/noor-icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/privacy.html",
  "/support.html",
];

const CONTENT_HOSTS = [
  "api.alquran.cloud",
  "api.aladhan.com",
  "everyayah.com",
  "www.everyayah.com",
];

function isContentRequest(url) {
  return CONTENT_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
}

async function putSafe(cacheName, request, response) {
  try {
    if (!response || !response.ok) return;
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  } catch {
    // Cache storage can fail on private mode, storage pressure, opaque responses, or browser limits.
  }
}

async function networkFirst(request, cacheName) {
  const cached = await caches.match(request);

  try {
    const response = await fetch(request);
    putSafe(cacheName, request, response);
    return response;
  } catch {
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      putSafe(cacheName, request, response);
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
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
            .filter((key) => key.startsWith("noorquran-") && key !== CACHE_NAME && key !== CONTENT_CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          putSafe(CACHE_NAME, "/index.html", response);
          return response;
        })
        .catch(() => caches.match("/index.html").then((response) => response || caches.match("/"))),
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
    return;
  }

  if (isContentRequest(url)) {
    event.respondWith(networkFirst(request, CONTENT_CACHE_NAME));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client) return client.navigate(targetUrl);
            return undefined;
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
        return undefined;
      }),
  );
});
