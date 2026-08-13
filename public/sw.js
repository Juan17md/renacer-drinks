const CACHE_VERSION = "renacer-v1";
const CACHE_PAGINAS = `${CACHE_VERSION}-paginas`;
const CACHE_ESTATICOS = `${CACHE_VERSION}-estaticos`;

const PAGINAS_CACHEAR = ["/", "/catalogo"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_PAGINAS)
      .then((cache) => cache.addAll(PAGINAS_CACHEAR))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(
          claves
            .filter((clave) => clave.startsWith("renacer-") && clave !== CACHE_VERSION)
            .map((clave) => caches.delete(clave))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const solicitud = evento.request;

  if (solicitud.method !== "GET") return;

  const url = new URL(solicitud.url);

  if (url.origin === "https://ve.dolarapi.com") return;

  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api")) {
    return;
  }

  evento.respondWith(
    caches.match(solicitud).then((respuestaCache) => {
      if (respuestaCache) return respuestaCache;

      return fetch(solicitud).then((respuesta) => {
        if (respuesta.ok && url.origin === self.location.origin) {
          const copia = respuesta.clone();
          caches
            .open(CACHE_ESTATICOS)
            .then((cache) => cache.put(solicitud, copia));
        }
        return respuesta;
      });
    })
  );
});
