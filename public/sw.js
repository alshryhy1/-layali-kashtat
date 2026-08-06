/* Layali Kashtat — navigation-safe service worker.
 * Document navigations always go to the network. Never respond with undefined
 * (that surfaces in Chrome as net::ERR_FAILED on /).
 */
const STATIC_CACHE = "lk-static-v3";

self.addEventListener("install", (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const dest = req.destination;
  if (dest === "document" || dest === "" || req.mode === "navigate") {
    // Network-only for HTML. On failure, fall back to a real Response (not undefined).
    event.respondWith(
      fetch(req).catch(
        () =>
          new Response(
            "<!doctype html><meta charset=utf-8><title>Offline</title><p dir=rtl>تعذر تحميل الصفحة. تحقق من الاتصال ثم أعد المحاولة.</p>",
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
          )
      )
    );
    return;
  }

  if (["style", "script", "image", "font"].includes(dest)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return (
            cached ||
            new Response("", { status: 504, statusText: "Offline" })
          );
        }
      })
    );
  }
});
