/**
 * Todo el razonamiento de la app vive acá: funciones puras, sin estado,
 * sin acceso al navegador. Eso las hace fáciles de probar y de reutilizar
 * desde cualquier pantalla.
 */

import { enEje, formatearDuracion } from "./reloj.js";
import {
  PLAN_POR_DEFECTO,
  planValido,
  DURACION_MAX,
  DURACION_MIN,
} from "./modelo.js";

// La franja donde el cuerpo vigila menos: entre la 01:00 y las 04:00.
// Despertarse ahí te saca del sueño profundo y cuesta más caro.
export const FRANJA_CRITICA = { desde: 420, hasta: 600 };

export const COSTE_HORA_TARDE = 3.5;
export const COSTE_HORA_CRITICA = 6.5;

/** Dormir de más descuenta 1,5 veces lo que suma trasnochar. */
export const FACTOR_RECUPERACION = 1.5;

export function enFranjaCritica(minutos) {
  return minutos >= FRANJA_CRITICA.desde && minutos < FRANJA_CRITICA.hasta;
}

function limitar(valor, min, max) {
  return Math.min(max, Math.max(min, valor));
}

/**
 * El corazón de la app: a qué hora te vas a levantar.
 *
 * En modo flexible, la hora de levantarse sale de la hora en la que te acostaste:
 * te acostás tarde, te levantás tarde. No es una regla, es la consecuencia.
 *
 * En modo anclado pasa lo contrario: la hora de levantarse está fija y lo que
 * cambia es cuánto dormís. Ahí es donde la app puede mostrarte la deuda.
 */
export function levantarsePrevisto(acostarse, plan = PLAN_POR_DEFECTO) {
  if (acostarse == null) return null;
  const p = planValido(plan);
  return p.modo === "anclado"
    ? p.anclaDespertar
    : acostarse + p.duracionObjetivo;
}

/** Cuánto cuesta, en puntos de energía, trasnochar `minutos` de más. */
export function costeDeTrasnocho(minutos, plan = PLAN_POR_DEFECTO) {
  if (!minutos || minutos <= 0) return 0;
  const p = planValido(plan);
  let coste = 0;
  for (let t = p.dormirObjetivo; t < p.dormirObjetivo + minutos; t += 5) {
    coste += (enFranjaCritica(t) ? COSTE_HORA_CRITICA : COSTE_HORA_TARDE) * 5;
  }
  return coste / 60;
}

/** Precio de un tramo de `minutos` que empieza en `desde`. */
export function costeDesde(desde, minutos) {
  let coste = 0;
  for (let t = desde; t < desde + minutos; t += 5) {
    coste += (enFranjaCritica(t) ? COSTE_HORA_CRITICA : COSTE_HORA_TARDE) * 5;
  }
  return coste / 60;
}

/**
 * Radiografía de una noche contra el plan.
 * Todo lo que la interfaz necesita sale de acá.
 */
export function analizarNoche(noche, plan = PLAN_POR_DEFECTO) {
  const p = planValido(plan);
  const acostarse = noche?.acostarse ?? null;
  const levantarse = noche?.levantarse ?? null;

  const durmido = acostarse != null && levantarse != null ? levantarse - acostarse : null;
  const desfase = acostarse != null ? acostarse - p.dormirObjetivo : null;
  const previsto = levantarsePrevisto(acostarse, p);

  // Positivo = te faltó dormir. Negativo = dormiste de más.
  const diferencia = durmido != null ? durmido - p.duracionObjetivo : null;

  const trasnocho = desfase != null ? Math.max(0, desfase) : null;
  // El retraso "toca" la franja crítica si el tramo perdido se solapa con ella.
  const tocaFranjaCritica =
    trasnocho != null &&
    trasnocho > 0 &&
    p.dormirObjetivo <= FRANJA_CRITICA.hasta &&
    (acostarse ?? 0) >= FRANJA_CRITICA.desde;

  return {
    fecha: noche?.fecha ?? null,
    acostarse,
    levantarse,
    durmido,
    previsto,
    desfase,
    trasnocho,
    diferencia,
    tocaFranjaCritica,
    completa: durmido != null && durmido > 0,
    costeTrasnocho: trasnocho != null ? costeDeTrasnocho(trasnocho, p) : 0,
    pospuestos: noche?.pospuestos ?? 0,
  };
}

/**
 * Recorre el historial en orden cronológico y arrastra la deuda.
 * Dormir de más perdona más rápido de lo que trasnochar castiga.
 */
export function calcularHistorial(noches, plan = PLAN_POR_DEFECTO) {
  const ordenadas = Object.values(noches ?? {})
    .filter(Boolean)
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));

  let deuda = 0;
  return ordenadas.map((noche) => {
    const analisis = analizarNoche(noche, plan);
    let delta = 0;
    if (analisis.completa) {
      delta =
        analisis.diferencia < 0
          ? -analisis.diferencia
          : -analisis.diferencia * FACTOR_RECUPERACION;
    }
    deuda = Math.max(-240, deuda + delta);
    return { ...analisis, deuda, delta };
  });
}

/**
 * Energía prevista para mañana, de 0 a 100.
 * No es una bola de cristal: es la cuenta de lo que se puede saber.
 */
export function energiaPrevista(analisis, deudaMin) {
  const porNocheCorta = Math.max(0, -(analisis?.diferencia ?? 0)) * 0.3;
  const porTrasnocho = (analisis?.costeTrasnocho ?? 0) * 0.8;
  const porDeuda = Math.min(25, (Math.max(0, deudaMin) / 60) * 2.5);
  const bruto = 100 - porNocheCorta - porTrasnocho - porDeuda;
  return Math.round(limitar(bruto, 0, 100));
}

/** Cuántas noches faltan para estar en paz, al ritmo actual. */
export function nochesParaEstarEnPaz(deudaMin, historial) {
  if (deudaMin <= 0) return 0;
  const conDelta = historial.filter((n) => n.delta !== 0).slice(-7);
  if (conDelta.length === 0) return Infinity;
  const promedio = conDelta.reduce((s, n) => s + n.delta, 0) / conDelta.length;
  if (promedio >= 0) return Infinity;
  return Math.ceil(deudaMin / Math.abs(promedio));
}

// ---------- La cinta de la noche ----------

/** Franjas de 30 minutos que cubren desde el mediodía hasta pasado mañana. */
export function franjasDeNoche(plan = PLAN_POR_DEFECTO) {
  const p = planValido(plan);
  const inicio = -360; // 12:00, para dar contexto antes de que empiece la noche
  const fin = Math.max(p.anclaDespertar, p.dormirObjetivo + p.duracionObjetivo) + 300;
  const franjas = [];
  for (let t = inicio; t < fin; t += 30) franjas.push({ inicio: t, fin: t + 30 });
  return franjas;
}

/**
 * Estado visual de una franja.
 * - "dia"        : todavía no empezó la noche
 * - "reposo"     : dormido de verdad
 * - "desperdiada": despierto cuando tocaba dormir
 * - "futuro"     : todavía no ocurre
 * - "ahora"      : el minuto en vivo
 */
export function clasificarFranja(franja, analisis, ahoraEje) {
  const { inicio, fin } = franja;
  if (fin <= 0) return "dia";
  if (ahoraEje != null && ahoraEje >= inicio && ahoraEje < fin) return "ahora";
  if (analisis?.acostarse != null) {
    const finNoche = analisis.levantarse ?? Infinity;
    if (inicio >= analisis.acostarse && fin <= finNoche) return "reposo";
    if (fin <= analisis.acostarse) return "desperdiada";
    return "futuro";
  }
  if (ahoraEje != null) return inicio >= ahoraEje ? "futuro" : "desperdiada";
  return "futuro";
}

/** Lo que la pantalla de hoy necesita, en un solo objeto. */
export function resumenActual(plan, noches, ahora = new Date()) {
  const p = planValido(plan);
  const eje = enEje(ahora);
  const clave = nocheDe(ahora);
  const analisis = analizarNoche(noches[clave], p);

  return {
    eje,
    clave,
    analisis,
    listoParaDormir: eje >= p.dormirObjetivo,
    /** Minutos que faltan para la hora en que te propusiste dormir. */
    faltaParaDormir: eje < p.dormirObjetivo ? p.dormirObjetivo - eje : 0,
    /** Minutos que llevás despierto de más. */
    pasadoParaDormir: eje >= p.dormirObjetivo ? eje - p.dormirObjetivo : 0,
    /** Si te acostás ahora mismo, a qué hora te levantás. */
    levantarseSiAhora: levantarsePrevisto(eje, p),
  };
}

/** Clave del día al que pertenece una fecha, usando la ventana de noche. */
export function nocheDe(fecha = new Date()) {
  const d = new Date(fecha);
  // Antes de las 18:00 la noche en curso sigue siendo la de ayer: la de hoy
  // todavía ni empezó.
  if (d.getHours() < 18) d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export { DURACION_MAX, DURACION_MIN, formatearDuracion };