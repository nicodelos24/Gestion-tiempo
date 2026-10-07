/**
 * Alarmas: recordatorios con hora fija sobre el eje de la noche.
 *
 * Este módulo es pura mecánica: guardar, calcular cuándo suena y posponer.
 * La política de *qué* avisar y *cuándo* vive en `useCicloNoche.js`.
 *
 * Limitación honesta: los temporizadores viven en la pestaña. Si la app está
 * cerrada, el aviso saluda al volver a abrirla. Para eso existe `vencidas`.
 */
import { enEje } from "../nucleo/reloj.js";

const CLAVE = "sueno:v2:alarmas";

export const TIPOS = {
  NOCHE: "aviso-noche",
  MANANA: "aviso-manana",
};

function leer() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    const lista = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function escribir(lista) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    // sin almacenamiento la app sigue viva, solo pierde las alarmas
  }
}

/**
 * Traduce un minuto del eje de la noche a una fecha real.
 * Si ese momento ya pasó, lo devuelve para el ciclo siguiente.
 */
export function instanteParaEje(ejeMin, desde = new Date()) {
  const ahora = desde.getTime();
  let delta = ejeMin - enEje(desde);
  if (delta <= 0) delta += 1440;
  return new Date(ahora + delta * 60000);
}

export function listar() {
  return leer().sort((a, b) => a.enEje - b.enEje);
}

export function buscar(tipo) {
  return leer().find((a) => a.tipo === tipo) ?? null;
}

/**
 * Crea o actualiza una alarma.
 * `pospuestas` se incrementa cada vez que el usuario la patea.
 */
export function programar({ tipo, enEje: eje, pospuestas = 0, extra = {} }) {
  const lista = leer();
  const existente = lista.find((a) => a.tipo === tipo);
  const alarma = {
    tipo,
    enEje: eje,
    pospuestas,
    createdAt: Date.now(),
    ...extra,
    ...(existente ? { pospuestas: pospuestas ?? existente.pospuestas } : {}),
  };
  escribir([...lista.filter((a) => a.tipo !== tipo), alarma]);
  return alarma;
}

export function posponer(tipo, minutos) {
  const alarma = buscar(tipo);
  if (!alarma) return null;
  return programar({
    tipo,
    enEje: (alarma.enEje + minutos + 1440) % 1440,
    pospuestas: alarma.pospuestas + 1,
    extra: alarma.origen ? { origen: alarma.origen } : {},
  });
}

export function cancelar(tipo) {
  escribir(leer().filter((a) => a.tipo !== tipo));
}

export function limpiar() {
  escribir([]);
}

/**
 * Alarmas que deberían haber sonado mientras la app estuvo cerrada.
 * Al abrirlas de nuevo las mostramos de inmediato para no perder nada.
 */
export function vencidas(hoy = new Date()) {
  const ahoraEje = enEje(hoy);
  return leer().filter((a) => {
    // Solo cuenta como vencida si su momento de hoy ya pasó.
    if (a.enEje > ahoraEje) return false;
    // Y no la damos por perdida al abrir: hay una hora de cortesía.
    return Date.now() - a.createdAt > 60 * 60 * 1000;
  });
}

/** Texto corto de cuánto falta para que suene. */
export function cuantoFalta(alarma, desde = new Date()) {
  const objetivo = instanteParaEje(alarma.enEje, desde);
  const ms = objetivo.getTime() - desde.getTime();
  const minutos = Math.max(0, Math.round(ms / 60000));
  if (minutos < 60) return `en ${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `en ${h} h` : `en ${h} h ${String(m).padStart(2, "0")}`;
}