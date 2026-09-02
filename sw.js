// Lembrete: sempre que publicar mudanças relevantes, incremente CACHE_VERSION.
// Isso evita o problema clássico do iPhone de manter versão antiga em cache.
const CACHE_VERSION = "v3";
const CACHE_NAME = `fortaleza2028-${CACHE_VERSION}`;

const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Se a chamada é pra outro domínio (ex: a API no Render), o service worker
  // não mexe em nada — deixa o navegador cuidar normalmente, sem interceptar.
  if (url.origin !== self.location.origin) {
    return;
  }

  // App shell (páginas do próprio site): cache primeiro, com atualização em segundo plano
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
