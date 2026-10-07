/**
 * Service worker: el que puede mostrar notificaciones con botones.
 *
 * La página se encarga de programar los avisos; el worker sólo los muestra y
 * traduce los clics en mensajes para la app. Así, aunque la pestaña esté en
 * segundo plano, los botones del aviso siguen respondiendo.
 */

const CACHE = "sueno-v2";

self.addEventListener("install", (evento) => {
  evento.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(self.clients.claim());
});

/** La página pide mostrar un aviso. */
self.addEventListener("message", (evento) => {
  const dato = evento.data;
  if (!dato) return;

  if (dato.tipo === "mostrar") {
    evento.waitUntil(mostrar(dato));
  }
  if (dato.tipo === "cerrar") {
    evento.waitUntil(
      self.registration.getNotifications({ tag: dato.tag }).then((lista) =>
        lista.forEach((n) => n.close())
      )
    );
  }
});

async function mostrar(dato) {
  const opciones = {
    body: dato.cuerpo,
    tag: dato.tag || "sueno",
    renotify: Boolean(dato.tag),
    requireInteraction: Boolean(dato.persistir),
    silent: false,
    vibrate: dato.vibracion ?? [120, 60, 120],
    actions: (dato.acciones ?? []).map((a) => ({
      action: a.id,
      title: a.texto,
    })),
    data: { tag: dato.tag, tipo: dato.tipoEvento },
  };
  await self.registration.showNotification(dato.titulo, opciones);
}

/** Clic en el aviso o en uno de sus botones. */
self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const accion = evento.action || "abrir";
  const etiqueta = evento.notification.data?.tag || "sueno";

  evento.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      const util = ventanas.find((c) => c.url.includes(self.location.origin));

      if (util) {
        await util.focus();
        util.postMessage({ tipo: "accion", accion, etiqueta });
        return;
      }

      // Si la app estaba cerrada, la abrimos y le pasamos la decisión.
      const url = new URL("/", self.location.origin);
      url.searchParams.set("accion", accion);
      url.searchParams.set("aviso", etiqueta);
      await self.clients.openWindow(url.toString());
    })()
  );
});

self.addEventListener("notificationclose", (evento) => {
  const ventanas = self.clients.matchAll({ type: "window", includeUncontrolled: true });
  ventanas.then((lista) => {
    for (const c of lista) {
      c.postMessage({
        tipo: "cerrada",
        etiqueta: evento.notification.data?.tag || "sueno",
      });
    }
  });
});