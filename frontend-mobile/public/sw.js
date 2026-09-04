/**
 * PetPrev VetCampo — Service Worker Offline-First (PWA)
 *
 * Estratégias:
 * - Navegação (HTML / Rotas): Network-First com timeout de 3 segundos
 *   (evita telas travadas em conexões 3G lentas ou degradadas em campo).
 * - Assets estáticos (JS, CSS, fontes, ícones): Cache-First com atualização em segundo plano.
 * - Endpoints de API / mutações: Ignorados (gerenciados pelo motor de sync Dexie no offline-db).
 */

const CACHE_NAME = "petprev-vetcampo-v1";
const NETWORK_TIMEOUT_MS = 3000;

const PRECACHE_URLS = [
  "/",
  "/caixa-termica",
  "/prontuario",
  "/tutor",
  "/manifest.webmanifest",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora chamadas que não sejam GET ou que sejam para a API backend
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  // 1. Estratégia para Navegação (Páginas HTML): Network-First com Timeout Curto de 3s
  const isNavigation =
    request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");

  if (isNavigation) {
    event.respondWith(
      new Promise((resolve) => {
        let didTimeout = false;

        const timer = setTimeout(async () => {
          didTimeout = true;
          const cached = (await caches.match(request)) || (await caches.match("/"));
          if (cached) {
            resolve(cached);
          }
        }, NETWORK_TIMEOUT_MS);

        fetch(request)
          .then(async (response) => {
            clearTimeout(timer);
            if (response.ok) {
              const cache = await caches.open(CACHE_NAME);
              cache.put(request, response.clone());
            }
            if (!didTimeout) {
              resolve(response);
            }
          })
          .catch(async () => {
            clearTimeout(timer);
            const cached = (await caches.match(request)) || (await caches.match("/"));
            if (cached) {
              resolve(cached);
            } else {
              resolve(new Response("Offline - Aplicativo PetPrev VetCampo", {
                status: 200,
                headers: { "Content-Type": "text/html; charset=utf-8" },
              }));
            }
          });
      }),
    );
    return;
  }

  // 2. Estratégia para Assets Estáticos (JS, CSS, Imagens, Fontes): Cache-First
  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) {
        // Atualiza o cache em segundo plano (Stale-While-Revalidate)
        fetch(request)
          .then(async (response) => {
            if (response.ok) {
              const cache = await caches.open(CACHE_NAME);
              cache.put(request, response);
            }
          })
          .catch(() => {});
        return cached;
      }

      // Se não estiver em cache, busca na rede e armazena
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch {
        return new Response(null, { status: 404 });
      }
    }),
  );
});
