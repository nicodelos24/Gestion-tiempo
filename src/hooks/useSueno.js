import { useCallback, useEffect, useMemo, useState } from "react";
import { claveDia, sumarDias } from "../lib/tiempo";
import {
  AJUSTES_POR_DEFECTO,
  analizarNoche,
  calcularHistorial,
  crearNoche,
  diasParaSanar,
  energiaPrevista,
  presupuestoNoche,
} from "../lib/sueno";

const CLAVE = "gestion-sueno:v1";

const ESTADO_INICIAL = {
  ajustes: { ...AJUSTES_POR_DEFECTO },
  noches: {},
};

function leer() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return ESTADO_INICIAL;
    const guardado = JSON.parse(crudo);
    return {
      ajustes: { ...AJUSTES_POR_DEFECTO, ...(guardado.ajustes ?? {}) },
      noches: guardado.noches ?? {},
    };
  } catch {
    return ESTADO_INICIAL;
  }
}

export function useSueno() {
  const [estado, setEstado] = useState(leer);

  useEffect(() => {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
  }, [estado]);

  const hoy = claveDia();

  //arantee de que siempre exista la noche de hoy.
  const noches = useMemo(() => {
    const base = estado.noches;
    return base[hoy] ? base : { ...base, [hoy]: crearNoche(hoy) };
  }, [estado.noches, hoy]);

  const historial = useMemo(
    () => calcularHistorial(Object.values(noches), estado.ajustes),
    [noches, estado.ajustes]
  );

  const analisisHoy = useMemo(
    () => analizarNoche(noches[hoy], estado.ajustes),
    [noches, hoy, estado.ajustes]
  );

  const deudaMin = historial.length ? historial[historial.length - 1].deuda : 0;
  const ultimaNocheCompleta = [...historial].reverse().find((n) => n.completa) ?? null;
  const energia = energiaPrevista(analisisHoy, ultimaNocheCompleta?.deuda ?? deudaMin);

  const actualizarNoche = useCallback(
    (campo, valor) => {
      setEstado((prev) => {
        const actual = prev.noches[hoy] ?? crearNoche(hoy);
        return {
          ...prev,
          noches: {
            ...prev.noches,
            [hoy]: { ...actual, [campo]: valor, actualizado: Date.now() },
          },
        };
      });
    },
    [hoy]
  );

  const ajustarNoche = useCallback(
    (campo, deltaMin) => {
      setEstado((prev) => {
        const actual = prev.noches[hoy] ?? crearNoche(hoy);
        const base = actual[campo] ?? (campo === "dormir" ? 330 : 420);
        const siguiente = Math.max(0, Math.min(16 * 60, base + deltaMin));
        return {
          ...prev,
          noches: {
            ...prev.noches,
            [hoy]: { ...actual, [campo]: siguiente, actualizado: Date.now() },
          },
        };
      });
    },
    [hoy]
  );

  const borrarNocheHoy = useCallback(() => {
    setEstado((prev) => {
      const noches = { ...prev.noches };
      delete noches[hoy];
      return { ...prev, noches };
    });
  }, [hoy]);

  const ajustarAjuste = useCallback((campo, deltaMin) => {
    setEstado((prev) => {
      const base = prev.ajustes[campo];
      const siguiente = Math.max(0, Math.min(16 * 60, base + deltaMin));
      const ajustes = { ...prev.ajustes, [campo]: siguiente };
      if (ajustes.despertar <= ajustes.dormir) {
        if (campo === "dormir") ajustes.dormir = ajustes.despertar - 240;
        else ajustes.despertar = ajustes.dormir + 360;
      }
      return { ...prev, ajustes };
    });
  }, []);

  const reiniciar = useCallback(() => setEstado(ESTADO_INICIAL), []);

  // Últimos N días listos para pintar.
  const ventana = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => sumarDias(hoy, -(13 - i))).map((fecha) => {
        const fila = historial.find((n) => n.fecha === fecha);
        return fila
          ? { ...fila, futuro: false }
          : { fecha, dormir: null, levantar: null, durmido: null, deuda: null, futuro: true };
      }),
    [historial, hoy]
  );

  const ultimos7 = historial.slice(-7);

  return {
    hoy,
    ajustes: estado.ajustes,
    noches,
    historial,
    analisisHoy,
    ventana,
    ultimos7,
    deudaMin,
    energia,
    presupuestoNoche: presupuestoNoche(estado.ajustes),
    diasParaSanar: diasParaSanar(deudaMin, ultimos7),
    acciones: { actualizarNoche, ajustarNoche, borrarNocheHoy, ajustarAjuste, reiniciar },
  };
}