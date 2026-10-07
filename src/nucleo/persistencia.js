/**
 * Persistencia local con versionado.
 *
 * Todo vive en localStorage: nada sale del dispositivo. El versionado permite
 * migrar los datos si algún día cambia la forma.
 */

import { PLAN_POR_DEFECTO, AJUSTES_POR_DEFECTO, planValido, ajustesValidos, nocheVacia } from "./modelo.js";
import { nocheDe } from "./calculos.js";

const CLAVE = "sueno:v2";
const VERSION = 2;

const VACIO = {
  version: VERSION,
  plan: PLAN_POR_DEFECTO,
  ajustes: AJUSTES_POR_DEFECTO,
  noches: {},
};

export function leer() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return { ...VACIO, noches: {} };
    const guardado = JSON.parse(crudo);
    return {
      version: VERSION,
      plan: planValido({ ...PLAN_POR_DEFECTO, ...(guardado.plan ?? {}) }),
      ajustes: ajustesValidos({ ...AJUSTES_POR_DEFECTO, ...(guardado.ajustes ?? {}) }),
      noches: guardado.noches ?? {},
    };
  } catch {
    return { ...VACIO, noches: {} };
  }
}

export function escribir(estado) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ ...estado, version: VERSION }));
  } catch {
    // Si el navegador bloquea el almacenamiento, la app sigue funcionando en memoria.
  }
}

export function borrarTodo() {
  localStorage.removeItem(CLAVE);
}

/** Devuelve la noche del día en curso, creándola si hace falta. */
export function conNocheDeHoy(noches, fecha = new Date()) {
  const clave = nocheDe(fecha);
  if (noches[clave]) return noches;
  return { ...noches, [clave]: nocheVacia(clave) };
}

/** Exporta todo el historial como JSON descargable. */
export function aArchivo(estado) {
  return JSON.stringify({ ...estado, exportadoEn: new Date().toISOString() }, null, 2);
}