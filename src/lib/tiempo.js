// Tiempo de la noche medido en minutos desde las 18:00 del día en que empieza la noche.
// Así 23:30 -> 330, 01:30 -> 450, 07:30 -> 810. Un solo eje, sin errores de cruce de medianoche.

export const ORIGEN_NOCHE = 18 * 60;
export const FIN_NOCHE = ORIGEN_NOCHE + 16 * 60; // hasta las 10:00 del día siguiente

// La noche corre de 18:00 a 10:00 del día siguiente. Entre las 10:00 y las 18:00,
// que es de día, el valor es negativo: esas horas no pertenecen a la noche actual.
export function minutosDesde18(fecha = new Date()) {
  const m = fecha.getHours() * 60 + fecha.getMinutes();
  const hora = fecha.getHours();
  if (hora >= 18) return m - ORIGEN_NOCHE;
  if (hora < 10) return m + 24 * 60 - ORIGEN_NOCHE;
  return m - ORIGEN_NOCHE;
}

export function desde18AMinutos(min) {
  const total = ORIGEN_NOCHE + min;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return { h, m };
}

export function formatearHora(min) {
  if (min == null || Number.isNaN(min)) return "--:--";
  const { h, m } = desde18AMinutos(Math.round(min));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatearDuracion(min) {
  if (min == null || Number.isNaN(min)) return "--";
  const signo = min < 0 ? "-" : "";
  const abs = Math.abs(Math.round(min));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${signo}${m} min`;
  return `${signo}${h} h ${String(m).padStart(2, "0")}`;
}

export function formatearDuracionCorta(min) {
  const abs = Math.abs(Math.round(min));
  const h = abs / 60;
  return `${h % 1 === 0 ? h : h.toFixed(1)} h`;
}

// Clave del día en formato YYYY-MM-DD (hora local)
export function claveDia(fecha = new Date()) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function sumarDias(clave, delta) {
  const [y, m, d] = clave.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  fecha.setDate(fecha.getDate() + delta);
  return claveDia(fecha);
}

export function etiquetaDia(clave) {
  const [y, m, d] = clave.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  const hoy = claveDia();
  if (clave === hoy) return "Hoy";
  if (clave === sumarDias(hoy, -1)) return "Ayer";
  return fecha.toLocaleDateString("es", { weekday: "short", day: "numeric" });
}