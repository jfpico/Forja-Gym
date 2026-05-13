// Service worker desactivado — siempre carga fresco desde el servidor
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
  );
  self.clients.claim();
});
// Sin caché — todas las peticiones van directamente a la red
