import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { leer, escribir, borrarTodo, conNocheDeHoy } from "../nucleo/persistencia.js";
import { nocheVacia, planValido, ajustesValidos } from "../nucleo/modelo.js";
import {
  analizarNoche,
  calcularHistorial,
  energiaPrevista,
  nochesParaEstarEnPaz,
  nocheDe,
} from "../nucleo/calculos.js";
import { enEje } from "../nucleo/reloj.js";

/**
 * Estado global de la app.
 *
 * Acá vive la única verdad: el plan, las noches registradas y las preferencias.
 * Todo lo demás se deriva con funciones puras de `nucleo/calculos.js`.
 */
export function useSueno() {
  const [estado, setEstado] = useState(() => leer());

  useEffect(() => {
    escribir(estado);
  }, [estado]);

  // La noche en curso siempre existe, aunque todavía no haya nada anotado.
  const noches = useMemo(() => conNocheDeHoy(estado.noches), [estado.noches]);

  const plan = planValido(estado.plan);
  const ajustes = ajustesValidos(estado.ajustes);

  const historial = useMemo(() => calcularHistorial(noches, plan), [noches, plan]);

  // El día al que pertenece la noche en curso. Se recalcula una vez por minuto
  // en vez de en cada render, para no depender de una lectura del reloj al pintar.
  const [hoy, setHoy] = useState(() => nocheDe(new Date()));
  useEffect(() => {
    const id = setInterval(() => setHoy(nocheDe(new Date())), 60000);
    return () => clearInterval(id);
  }, []);
  const analisisHoy = useMemo(() => analizarNoche(noches[hoy], plan), [noches, hoy, plan]);

  const deudaMin = historial.length ? historial[historial.length - 1].deuda : 0;
  const energia = energiaPrevista(analisisHoy, deudaMin);
  const nochesParaSanar = nochesParaEstarEnPaz(deudaMin, historial);

  const setPlan = useCallback((cambios) => {
    setEstado((prev) => ({ ...prev, plan: planValido({ ...prev.plan, ...cambios }) }));
  }, []);

  const setAjuste = useCallback((cambios) => {
    setEstado((prev) => ({
      ...prev,
      ajustes: ajustesValidos({ ...prev.ajustes, ...cambios }),
    }));
  }, []);

  const marcar = useCallback((fecha, cambios) => {
    setEstado((prev) => {
      const base = prev.noches[fecha] ?? nocheVacia(fecha);
      return {
        ...prev,
        noches: { ...prev.noches, [fecha]: { ...base, ...cambios, updatedAt: Date.now() } },
      };
    });
  }, []);

  const acostarse = useCallback(
    (fecha, minuto) => marcar(fecha, { acostarse: minuto, avisada: true }),
    [marcar]
  );

  const levantarse = useCallback(
    (fecha, minuto) => marcar(fecha, { levantarse: minuto }),
    [marcar]
  );

  const borrarNoche = useCallback((fecha) => {
    setEstado((prev) => {
      const noches = { ...prev.noches };
      delete noches[fecha];
      return { ...prev, noches };
    });
  }, []);

  const reiniciar = useCallback(() => {
    borrarTodo();
    setEstado({ version: estado.version, plan: estado.plan, ajustes: estado.ajustes, noches: {} });
  }, [estado]);

  return {
    estado,
    plan,
    ajustes,
    noches,
    historial,
    hoy,
    analisisHoy,
    deudaMin,
    energia,
    nochesParaSanar,
    acciones: {
      setPlan,
      setAjuste,
      marcar,
      acostarse,
      levantarse,
      borrarNoche,
      reiniciar,
    },
  };
}

/** Reloj vivo: se refresca solo para que la app no quede congelada. */
export function useReloj(intervaloMs = 20000) {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), intervaloMs);
    const alVolver = () => setAhora(new Date());
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [intervaloMs]);
  return { ahora, eje: enEje(ahora) };
}

/** Un `setTimeout` que se limpia solo y no dispara si el componente se desmonta. */
export function useTemporizador() {
  const referencia = useRef(null);
  const armar = useCallback((alDisparar, milisegundos) => {
    if (referencia.current) clearTimeout(referencia.current);
    referencia.current = setTimeout(alDisparar, Math.max(0, milisegundos));
  }, []);
  const cancelar = useCallback(() => {
    if (referencia.current) clearTimeout(referencia.current);
    referencia.current = null;
  }, []);
  useEffect(() => cancelar, [cancelar]);
  return { armar, cancelar };
}