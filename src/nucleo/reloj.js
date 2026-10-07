/**
 * Eje temporal de la noche.
 *
 * Toda la app razona sobre una sola unidad: minutos contados desde las 18:00.
 * Asi 23:30 es 330, las 02:30 es 510 y las 07:30 es 810, y cruzar la medianoche
 * deja de ser un problema: es simplemente "seguir sumando".
 *
 * Entre las 18:00 y las 10:00 (hora de la manana siguiente) el valor es positivo.
 * Entre las 10:00 y las 18:00 es de dia, y el valor es negativo.
 */

export const INICIO_NOCHE = 18 * 60; // 18:00
export const FIN_NOCHE = 30 * 60; // 06:00 del dia siguiente
export const TOPE_EJE = 24 * 60; // tope superior usado por los deslizadores

/** Convierte una fecha real al eje de la noche. */
export function enEje(fecha = new Date()) {
  const h = fecha.getHours();
  const m = fecha.getMinutes();
  const minutos = h * 60 + m;
  if (h >= 18) return minutos - INICIO_NOCHE;
  if (h < 10) return minutos + 24 * 60 - INICIO_NOCHE;
  return minutos - INICIO_NOCHE;
}

/** Convierte minutos del eje a una hora de reloj. */
export function aHoraDelDia(minutos) {
  const total = (((INICIO_NOCHE + minutos) % 1440) + 1440) % 1440;
  return { hora: Math.floor(total / 60), minuto: total % 60 };
}

/** "23:30" a partir de minutos del eje. */
export function formatearHora(minutos) {
  if (minutos == null || Number.isNaN(minutos)) return "--:--";
  const { hora, minuto } = aHoraDelDia(Math.round(minutos));
  return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}

/** "7 h 30" o "45 min". Siempre en espanol, sin decimales. */
export function formatearDuracion(minutos) {
  if (minutos == null || Number.isNaN(minutos)) return "--";
  const signo = minutos < 0 ? "-" : "";
  const abs = Math.abs(Math.round(minutos));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${signo}${m} min`;
  if (m === 0) return `${signo}${h} h`;
  return `${signo}${h} h ${String(m).padStart(2, "0")}`;
}

/** Version compacta para etiquetas: "7,5 h". */
export function duracionCompacta(minutos) {
  if (minutos == null || Number.isNaN(minutos)) return "--";
  const h = minutos / 60;
  return `${Math.round(h * 10) / 10} h`;
}

/** Convierte "23:30" a minutos del eje. Devuelve null si no se puede. */
export function parsearHora(texto) {
  const coincidencia = /^(\d{1,2}):(\d{2})$/.exec(String(texto).trim());
  if (!coincidencia) return null;
  const h = Number(coincidencia[1]);
  const m = Number(coincidencia[2]);
  if (h > 23 || m > 59) return null;
  const minutos = h * 60 + m;
  if (h >= 18) return minutos - INICIO_NOCHE;
  if (h < 10) return minutos + 24 * 60 - INICIO_NOCHE;
  return minutos - INICIO_NOCHE;
}

// ---------- Fechas locales (YYYY-MM-DD), sin líos de zona horaria ----------

export function claveDia(fecha = new Date()) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fechaDesdeClave(clave) {
  const [y, m, d] = clave.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function sumarDias(clave, delta) {
  const fecha = fechaDesdeClave(clave);
  fecha.setDate(fecha.getDate() + delta);
  return claveDia(fecha);
}

export function etiquetaDia(clave) {
  const hoy = claveDia();
  if (clave === hoy) return "Hoy";
  if (clave === sumarDias(hoy, -1)) return "Ayer";
  if (clave === sumarDias(hoy, 1)) return "Mañana";
  return fechaDesdeClave(clave).toLocaleDateString("es", {
    weekday: "short",
    day: "numeric",
  });
}

export function weekday(clave) {
  return fechaDesdeClave(clave).getDay();
}

/** Minutos que faltan desde ahora hasta `objetivo` del eje de la noche. */
export function minutosHasta(objetivo, ahora = enEje(new Date())) {
  let delta = objetivo - ahora;
  if (delta < -INICIO_NOCHE) delta += 1440;
  return delta;
}

/** ¿Estamos dentro de la ventana de noche (18:00 a 10:00)? */
export function esNoche(fecha = new Date()) {
  const h = fecha.getHours();
  return h >= 18 || h < 10;
}