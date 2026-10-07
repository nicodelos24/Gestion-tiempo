/**
 * Forma de los datos y valores por defecto.
 *
 * Todo el estado de la app son tres cosas y ninguna mas:
 *   - plan:      los objetivos que uno se propone
 *   - noches:    el registro de lo que realmente paso, por dia
 *   - ajustes:   preferencias de la interfaz y de las notificaciones
 */

export const DURACION_MIN = 5 * 60;
export const DURACION_MAX = 11 * 60;

export const PLAN_POR_DEFECTO = {
  /** Minuto del eje en el que querés estar acostado. 330 = 23:30 */
  dormirObjetivo: 330,
  /** Cuántas horas querés dormir de verdad. 480 = 8 h */
  duracionObjetivo: 480,
  /**
   * "flexible": te levantás después de la duración que te propongas.
   * "anclado":  te levantás siempre a la misma hora, aunque te acuestes tarde,
   *             y lo que falta se convierte en deuda.
   */
  modo: "flexible",
  /** Hora fija de levantarse. Solo se usa en modo "anclado". 810 = 07:30 */
  anclaDespertar: 810,
};

export const AJUSTES_POR_DEFECTO = {
  /** Minutos antes de la hora de dormir para el primer aviso. */
  avisoPrevio: 45,
  /** Minutos extra que suma el botón de posponer. */
  posponerMin: 30,
  /** Si el aviso de la mañana se manda mientras dormís, posponele estos minutos. */
  avisoTarde: 30,
  /** Tope de pospones seguidos antes de exigir una decisión. */
  posponerMax: 3,
  /** Mostrar la cinta de la noche en la pantalla de hoy. */
  mostrarCinta: true,
};

export function planValido(plan = PLAN_POR_DEFECTO) {
  return {
    ...PLAN_POR_DEFECTO,
    ...plan,
    dormirObjetivo: limitar(plan.dormirObjetivo ?? PLAN_POR_DEFECTO.dormirObjetivo, 0, 1439),
    duracionObjetivo: limitar(
      plan.duracionObjetivo ?? PLAN_POR_DEFECTO.duracionObjetivo,
      DURACION_MIN,
      DURACION_MAX
    ),
    modo: plan.modo === "anclado" ? "anclado" : "flexible",
    anclaDespertar: limitar(
      plan.anclaDespertar ?? PLAN_POR_DEFECTO.anclaDespertar,
      240,
      1439
    ),
  };
}

export function ajustesValidos(ajustes = AJUSTES_POR_DEFECTO) {
  return { ...AJUSTES_POR_DEFECTO, ...ajustes };
}

export function limitar(valor, min, max) {
  const n = Number(valor);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/** Una noche vacia para un dia. */
export function nocheVacia(fecha) {
  return {
    fecha,
    acostarse: null,
    levantarse: null,
    pospuestos: 0,
    avisada: false,
    updatedAt: 0,
  };
}

/** Una noche es utilizable cuando sabemos cuándo se acostó. */
export function nocheRegistrada(noche) {
  return Boolean(noche && noche.acostarse != null);
}

/** Una noche está completa cuando además sabemos cuándo se levantó. */
export function nocheCompleta(noche) {
  return Boolean(noche && noche.acostarse != null && noche.levantarse != null);
}