import {
  ORIGEN_NOCHE,
  minutosDesde18,
  claveDia,
} from "./tiempo.js";

export const MIN_POR_HORA = 60;

const A_18 = (hora, minuto = 0) => hora * 60 + minuto - 18 * 60;

// Todo el modelo vive en un único eje: minutos contados desde las 18:00.
export const AJUSTES_POR_DEFECTO = {
  dormir: A_18(23, 30), // 23:30 -> 330
  despertar: A_18(24 + 7, 30), // 07:30 del día siguiente -> 810
};

export const VENTANA_CRITICA = { desde: A_18(25, 0), hasta: A_18(28, 0) }; // 01:00 - 04:00

// Coste en puntos de energía de cada minuto pasado despierto de más.
export const COSTE_HORA_TARDE = 3.5;
export const COSTE_HORA_CRITICA = 6.5;

// Dormir de más recupera 1.5x: la deuda perdona, pero no se olvida.
export const FACTOR_RECUPERACION = 1.5;

export function presupuestoNoche(ajustes = AJUSTES_POR_DEFECTO) {
  return ajustes.despertar - ajustes.dormir;
}

export function esHoraCritica(min) {
  return min >= VENTANA_CRITICA.desde && min < VENTANA_CRITICA.hasta;
}

// Cuánto energía cuesta quedarse despierto X minutos de más en la noche.
export function costeDeInversion(minutos, ajustes = AJUSTES_POR_DEFECTO) {
  return costeDesde(ajustes.dormir, minutos);
}

// Coste de `minutos` de retraso empezando en `desdeMin` del eje de la noche.
export function costeDesde(desdeMin, minutos) {
  let coste = 0;
  for (let t = desdeMin; t < desdeMin + minutos; t += 5) {
    coste += (esHoraCritica(t) ? COSTE_HORA_CRITICA : COSTE_HORA_TARDE) * 5;
  }
  return coste / MIN_POR_HORA;
}

// Analiza una noche concreta.
export function analizarNoche(noche, ajustes = AJUSTES_POR_DEFECTO) {
  const objetivoNoche = presupuestoNoche(ajustes);
  const dormir = noche?.dormir ?? null;
  const levantar = noche?.levantar ?? null;

  const durmido = dormir != null && levantar != null ? levantar - dormir : null;
  const desfase = dormir != null ? dormir - ajustes.dormir : null; // >0 = se acostó tarde
  const falta = durmido != null ? durmido - objetivoNoche : null;

  const inversion = desfase != null ? Math.max(0, desfase) : null;
  const energiaPerdida =
    inversion != null ? costeDeInversion(inversion, ajustes) : null;

  // La hora de despertar prevista se empuja, literalmente, minuto a minuto.
  const despertarPrevisto = desfase != null ? ajustes.despertar + desfase : null;

  return {
    fecha: noche?.fecha ?? null,
    dormir,
    levantar,
    durmido,
    objetivoNoche,
    desfase,
    falta,
    inversion,
    energiaPerdida,
    despertarPrevisto,
    completa: durmido != null && durmido > 0,
    costoCritico:
      inversion != null && dormir + inversion / 2 >= VENTANA_CRITICA.desde,
  };
}

// Energía prevista para mañana, en puntos de 0 a 100.
export function energiaPrevista(analisis, deudaMin) {
  const base = 100;
  const porFaltaDeSueno = analisis.falta != null && analisis.falta < 0 ? -analisis.falta * 0.55 : 0;
  const porInversion = analisis.energiaPerdida ?? 0;
  const porDeuda = Math.min(35, deudaMin / MIN_POR_HORA * 3.2);
  return Math.max(0, Math.min(100, Math.round(base - porFaltaDeSueno - porInversion - porDeuda)));
}

// Recorre el historial en orden cronológico y calcula la deuda acumulada.
export function calcularHistorial(noches, ajustes = AJUSTES_POR_DEFECTO) {
  const ordenadas = [...noches].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  let deuda = 0;
  return ordenadas.map((noche) => {
    const analisis = analizarNoche(noche, ajustes);
    let delta = 0;
    if (analisis.completa) {
      if (analisis.falta < 0) delta = -analisis.falta; // acumulo
      else delta = -analisis.falta * FACTOR_RECUPERACION; // recupero más rápido
    }
    deuda = Math.max(-180, deuda + delta);
    return { ...analisis, deuda, delta };
  });
}

// Días que faltan para estar en paz, a ritmo actual.
export function diasParaSanar(deudaMin, ultimos7) {
  const ultimas = ultimos7.filter((n) => n.delta !== 0);
  if (deudaMin <= 0 || ultimas.length === 0) return 0;
  const promedio = ultimas.reduce((s, n) => s + n.delta, 0) / ultimas.length;
  if (promedio >= 0) return Infinity;
  return Math.ceil(deudaMin / Math.abs(promedio));
}

// Ruta de franjas de la noche para el visual principal.
export function franjasDeNoche(ajustes = AJUSTES_POR_DEFECTO) {
  const inicio = ORIGEN_NOCHE - 360; // 12:00, para contextualizar la tarde
  const fin = ajustes.despertar + 240;
  const franjas = [];
  for (let t = inicio; t < fin; t += 30) {
    franjas.push({ inicio: t, fin: t + 30, centro: t + 15 });
  }
  return franjas;
}

// Un tramo de 30 minutos de la noche, ya resuelto a un estado visual.
export function clasificarFranja(franja, analisis, ahoraMin) {
  const { inicio, fin } = franja;
  if (fin <= ORIGEN_NOCHE) return "tarde";
  if (ahoraMin != null && ahoraMin >= inicio && ahoraMin < fin) return "ahora";
  if (analisis.levantar != null) {
    return inicio >= analisis.dormir && fin <= analisis.levantar ? "dormido" : "despierto";
  }
  // Noche en curso: hacia atrás está despierto, hacia adelante todavía no ocurre.
  if (ahoraMin != null) return inicio >= ahoraMin ? "pendiente" : "despierto";
  return "pendiente";
}

export function crearNoche(fecha = claveDia()) {
  return { fecha, dormir: null, levantar: null, actualizado: Date.now() };
}

export function ahoraEnEjeNoche(fecha = new Date()) {
  return minutosDesde18(fecha);
}