/**
 * Envoltura de la Web Notifications API.
 *
 * Los botones del aviso sólo funcionan si la notificación la muestra un
 * service worker, así que preferimos esa vía y sólo caemos a la API suelta
 * cuando no hay service worker (por ejemplo, al abrir el archivo sin server).
 */

let registroSW = null;

export function soportaNotificaciones() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function estadoPermiso() {
  if (!soportaNotificaciones()) return "no-soportado";
  return Notification.permission; // "default" | "granted" | "denied"
}

export async function pedirPermiso() {
  if (!soportaNotificaciones()) return "no-soportado";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export async function registrarServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  if (registroSW) return registroSW;
  try {
    registroSW = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    return registroSW;
  } catch {
    return null;
  }
}

/**
 * Muestra un aviso.
 * @param {{titulo:string, cuerpo:string, tag?:string, acciones?:Array, persistir?:boolean, vibracion?:number[]}} aviso
 */
export async function mostrarAviso(aviso) {
  if (estadoPermiso() !== "granted") return null;

  const payload = {
    tipo: "mostrar",
    titulo: aviso.titulo,
    cuerpo: aviso.cuerpo,
    tag: aviso.tag,
    acciones: aviso.acciones ?? [],
    persistir: aviso.persistir ?? false,
    vibracion: aviso.vibracion,
    tipoEvento: aviso.tipoEvento,
  };

  const sw = await registrarServiceWorker();
  if (sw) {
    sw.active?.postMessage(payload);
    return true;
  }

  // Sin service worker: al menos el aviso aparece, con clic para abrir la app.
  try {
    const n = new Notification(payload.titulo, {
      body: payload.cuerpo,
      tag: payload.tag,
      icon: "/favicon.svg",
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch {
    return null;
  }
}

export async function cerrarAviso(tag) {
  const sw = await registrarServiceWorker();
  if (sw) sw.active?.postMessage({ tipo: "cerrar", tag });
}

/**
 * Escucha las respuestas del service worker mientras la app está abierta.
 * Devuelve la función para dejar de escuchar.
 */
export function escucharAcciones(alRecibir) {
  if (!("serviceWorker" in navigator)) return () => {};
  const manejar = (evento) => {
    if (evento.data?.tipo === "accion") alRecibir(evento.data);
    if (evento.data?.tipo === "cerrada") alRecibir(evento.data);
  };
  navigator.serviceWorker.addEventListener("message", manejar);
  return () => navigator.serviceWorker.removeEventListener("message", manejar);
}

/** ¿La pestaña está visible? Sirve para no vibrar en segundo plano. */
export function pestanaVisible() {
  return document.visibilityState === "visible";
}