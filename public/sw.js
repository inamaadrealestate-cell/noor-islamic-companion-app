const CACHE_NAME = "noorquran-shell-v8-error-safe";
const CONTENT_CACHE_NAME = "noorquran-content-v8-error-safe";

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
  return CONTENT_HOSTS.some(function (host) {
    return url.hostname === host || url.hostname.endsWith("." + host);
  });
}

async function openCacheSafe(cacheName) {
  try {
    if (typeof caches === "undefined") return null;
    return await caches.open(cacheName);
  } catch (error) {
    return null;
  }
}

async function cacheAppShellSafe() {
  const cache = await openCacheSafe(CACHE_NAME);
  if (!cache) return;

  await Promise.all(
    APP_SHELL.map(async function (url) {
      try {
        const response = await fetch(url, { cache: "reload" });
        if (response && response.ok) await cache.put(url, response.clone());
      } catch (error) {
        // A missing icon/page or Safari cache restriction must not break installation.
      }
    }),
  );
}

async function putSafe(cacheName, request, response) {
  try {
    if (!response || !response.ok) return;
    const cache = await openCacheSafe(cacheName);
    if (!cache) return;
    await cache.put(request, response.clone());
  } catch (error) {
    // Cache storage can fail in private mode, storage pressure, or Safari restrictions.
  }
}

async function matchSafe(request) {
  try {
    if (typeof caches === "undefined") return undefined;
    return await caches.match(request);
  } catch (error) {
    return undefined;
  }
}

function offlineFallbackResponse() {
  return new Response(
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NoorQuran Offline</title></head><body style="font-family:system-ui;padding:24px;line-height:1.6"><h1>NoorQuran</h1><p>You are offline. Open NoorQuran again after the page cache is ready, or reconnect once to refresh the app.</p></body></html>',
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function networkFirst(request, cacheName) {
  const cached = await matchSafe(request);

  try {
    const response = await fetch(request);
    putSafe(cacheName, request, response);
    return response;
  } catch (error) {
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await matchSafe(request);

  const fetchPromise = fetch(request)
    .then(function (response) {
      putSafe(cacheName, request, response);
      return response;
    })
    .catch(function () {
      return cached || Response.error();
    });

  return cached || fetchPromise;
}

self.addEventListener("install", function (event) {
  event.waitUntil(cacheAppShellSafe().then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    (typeof caches === "undefined"
      ? Promise.resolve([])
      : caches.keys()
    )
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key.indexOf("noorquran-") === 0 && key !== CACHE_NAME && key !== CONTENT_CACHE_NAME;
            })
            .map(function (key) {
              try {
                return caches.delete(key);
              } catch (error) {
                return Promise.resolve(false);
              }
            }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", function (event) {
  const request = event.request;
  if (!request || request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch (error) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          putSafe(CACHE_NAME, "/index.html", response);
          return response;
        })
        .catch(function () {
          return matchSafe("/index.html").then(function (response) {
            if (response) return response;
            return matchSafe("/").then(function (rootResponse) {
              return rootResponse || offlineFallbackResponse();
            });
          });
        }),
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

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const targetUrl = event.notification && event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
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
