import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TIPOS,
  buscar,
  cancelar,
  cuantoFalta,
  instanteParaEje,
  listar,
  posponer,
  programar,
  vencidas,
} from "../servicios/alarmas.js";
import {
  estadoPermiso,
  escucharAcciones,
  mostrarAviso,
  pedirPermiso as pedirPermisoReal,
  cerrarAviso,
  registrarServiceWorker,
} from "../servicios/notificaciones.js";
import { levantarsePrevisto, nocheDe } from "../nucleo/calculos.js";
import { enEje, formatearHora, formatearDuracion } from "../nucleo/reloj.js";
import { aArchivo } from "../nucleo/persistencia.js";
import { useReloj, useTemporizador } from "./useSueno.js";

/**
 * El ciclo de una noche, de punta a punta.
 *
 * Decide qué aviso tiene que existir en cada momento, lo programa, lo muestra
 * y traduce lo que la persona conteste. Acá se junta el plan, el registro y
 * los avisos; `nucleo/calculos.js` sigue sin enterarse de que existen avisos.
 */
export function useCicloNoche({ plan, ajustes, noches, hoy, analisisHoy, acciones }) {
  const [alarmas, setAlarmas] = useState(() => listar());
  const [permiso, setPermiso] = useState(() => estadoPermiso());
  const { ahora, eje } = useReloj();
  const { armar } = useTemporizador();
  const yaRespondio = useRef(false);

  // Sincroniza el estado con lo que hay guardado, pero sin provocar un render
  // extra cuando nada cambió realmente.
  const refrescar = useCallback(() => {
    setAlarmas((prev) => {
      const siguiente = listar();
      const iguales =
        siguiente.length === prev.length &&
        siguiente.every(
          (a, i) =>
            a.tipo === prev[i].tipo &&
            a.enEje === prev[i].enEje &&
            a.pospuestas === prev[i].pospuestas
        );
      return iguales ? prev : siguiente;
    });
  }, []);

  const pedirPermiso = useCallback(async () => {
    const resultado = await pedirPermisoReal();
    setPermiso(resultado);
    return resultado;
  }, []);

  // ---------- 1. Qué aviso corresponde ahora ----------

  const deseada = useMemo(() => {
    const acostado = analisisHoy.acostarse;

    if (acostado == null) {
      // Todavía no se acostó. Avisamos antes del objetivo y, si ya pasó,
      // volvemos a preguntar cada tanto en lugar de quedarnos en silencio.
      const previa = (plan.dormirObjetivo - ajustes.avisoPrevio + 1440) % 1440;
      if (eje >= plan.dormirObjetivo) {
        return { tipo: TIPOS.NOCHE, enEje: (eje + ajustes.posponerMin) % 1440, insistent: true };
      }
      if (eje >= previa) {
        return { tipo: TIPOS.NOCHE, enEje: (eje + 5) % 1440, insistent: true };
      }
      return { tipo: TIPOS.NOCHE, enEje: previa, insistent: false };
    }

    const previsto = levantarsePrevisto(acostado, plan);
    return {
      tipo: TIPOS.MANANA,
      enEje: (previsto - ajustes.avisoTarde + 1440) % 1440,
      insistent: false,
    };
  }, [analisisHoy.acostarse, plan, ajustes.avisoPrevio, ajustes.avisoTarde, ajustes.posponerMin, eje]);

  // ---------- 2. Sincronizar con el almacenamiento ----------

  useEffect(() => {
    const actual = buscar(deseada.tipo);
    const cambioDeNoche = actual?.noche !== hoy;
    if (!actual || actual.enEje !== deseada.enEje || cambioDeNoche) {
      programar({
        tipo: deseada.tipo,
        enEje: deseada.enEje,
        pospuestas: cambioDeNoche ? 0 : (actual?.pospuestas ?? 0),
        extra: { noche: hoy },
      });
      refrescar();
    }
  }, [deseada, hoy, refrescar]);

  // ---------- 3. Lo que el usuario contesta ----------

  const registrarAcostarse = useCallback(
    (minuto) => {
      acciones.acostarse(hoy, minuto);
      refrescar();
    },
    [acciones, hoy, refrescar]
  );

  const registrarLevantarse = useCallback(
    (minuto) => {
      acciones.levantarse(hoy, minuto);
      refrescar();
    },
    [acciones, hoy, refrescar]
  );

  const patearAvisoNoche = useCallback(() => {
    const alarma = buscar(TIPOS.NOCHE);
    posponer(TIPOS.NOCHE, ajustes.posponerMin);
    refrescar();
    return alarma;
  }, [ajustes.posponerMin, refrescar]);

  const responder = useCallback(
    (accion) => {
      if (accion === "acostado") {
        registrarAcostarse(enEje(new Date()));
        return;
      }
      if (accion === "posponer") {
        patearAvisoNoche();
        return;
      }
      if (accion.startsWith("levantarse")) {
        constExtra = Number(accion.slice("levantarse".length)) || 0;
        registrarLevantarse(enEje(new Date()) + extraMin);
      }
    },
    [registrarAcostarse, registrarLevantarse, patearAvisoNoche]
  );

  // ---------- 4. Contenido de los avisos ----------

  const construirAviso = useCallback(
    (tipo) => {
      if (tipo === TIPOS.NOCHE) {
        const pospuestas = buscar(TIPOS.NOCHE)?.pospuestas ?? 0;
        const retraso = eje - plan.dormirObjetivo;
        const siAhora = levantarsePrevisto(eje, plan);

        if (retraso > 0) {
          return {
            titulo: `Van ${formatearDuracion(retraso)} de más`,
            cuerpo:
              pospuestas > 0
                ? `Es el aviso ${pospuestas + 1}. Si te acostás ahora, mañana te levantás a las ${formatearHora(siAhora)}.`
                : `Si te acostás ahora, mañana te levantás a las ${formatearHora(siAhora)}.`,
            tag: TIPOS.NOCHE,
            tipoEvento: TIPOS.NOCHE,
            persistir: pospuestas >= 2,
            acciones: [
              { id: "posponer", texto: `En ${ajustes.posponerMin} min` },
              { id: "acostado", texto: "Ya me acosté" },
            ],
          };
        }
        return {
          titulo: "Faltan minutos para dormir",
          cuerpo: `Tu hora es las ${formatearHora(plan.dormirObjetivo)}. Si te acostás ahora, te levantás a las ${formatearHora(siAhora)}.`,
          tag: TIPOS.NOCHE,
          tipoEvento: TIPOS.NOCHE,
          acciones: [
            { id: "posponer", texto: `En ${ajustes.posponerMin} min` },
            { id: "acostado", texto: "Ya me acosté" },
          ],
        };
      }

      const acostarse = analisisHoy.acostarse;
      const previsto = levantarsePrevisto(acostarse, plan);
      return {
        titulo: "¿A qué hora te levantaste?",
        cuerpo:
          previsto != null
            ? `Te acostaste a las ${formatearHora(acostarse)}. Tu hora prevista era las ${formatearHora(previsto)}.`
            : "Confirmá tu hora de levantada para cerrar el registro de anoche.",
        tag: TIPOS.MANANA,
        tipoEvento: TIPOS.MANANA,
        persistir: true,
        acciones: [
          { id: "levantarse", texto: "Ahora" },
          { id: "levantarse30", texto: "+30 min" },
          { id: "levantarse60", texto: "+1 h" },
        ],
      };
    },
    [ajustes.posponerMin, analisisHoy.acostarse, eje, plan]
  );

  // ---------- 5. Disparar el aviso ----------


  // ---------- 6. Temporizador ----------

  useEffect(() => {
    const alarma = alarmsEnCurso(alarmas, ahora);
    if (!alarma) return;
    const cuando = instanteParaEje(alarma.enEje, ahora);
    const espera = Math.max(0, cuando.getTime() - ahora.getTime());
    armar(() => {
      if (estadoPermiso() === "granted") mostrarAviso(construirAviso(alarma.tipo));
    }, espera);
  }, [alarmas, ahora, armar, construirAviso]);

  // ---------- 7. Escuchar respuestas del service worker ----------

  useEffect(() => {
    registrarServiceWorker();
    const parar = escucharAcciones((mensaje) => {
      if (mensaje.tipo === "accion") responder(mensaje.accion);
      if (mensaje.tipo === "cerrada" && !yaRespondio.current) {
        // Cerrado sin contestar: suavizamos, no castigamos.
        yaRespondio.current = true;
      }
    });
    return parar;
  }, [responder]);

  // ---------- 8. Avisos que se perdieron con la app cerrada ----------

  useEffect(() => {
    const perdidos = vencidas();
    if (perdidos.length === 0) return;
    if (estadoPermiso() !== "granted") return;
    perdidos.forEach((alarma) => {
      mostrarAviso(construirAviso(alarma.tipo));
      cancelar(alarma.tipo);
    });
    refrescar();
  }, [construirAviso, refrescar]);

  // Respuesta que llegó en la URL porque la app estaba cerrada.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accion = params.get("accion");
    if (!accion) return;
    responder(accion);
    window.history.replaceState({}, "", window.location.pathname);
  }, [responder]);

  /** Botón "Probar un aviso": dispara uno de verdad para verificar permisos. */
  const dispararPrueba = useCallback(async () => {
    if (estadoPermiso() !== "granted") {
      const resultado = await pedirPermiso();
      setPermiso(resultado);
      if (resultado !== "granted") return false;
    }
    await mostrarAviso({
      titulo: "Así se ve un aviso",
      cuerpo:
        "Éste es el aviso de prueba. Cuando llegue la hora, vas a ver uno igual con botones para posponer o confirmar que te acostaste.",
      tag: "prueba",
      acciones: [
        { id: "posponer", texto: `En ${ajustes.posponerMin} min` },
        { id: "acostado", texto: "Ya me acosté" },
      ],
    });
    return true;
  }, [ajustes.posponerMin, pedirPermiso]);

  /** Descarga todo el historial como un archivo JSON. */
  const exportar = useCallback(() => {
    const datos = aArchivo({ plan, noches });
    const url = URL.createObjectURL(new Blob([datos], { type: "application/json" }));
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `sueno-${new Date().toISOString().slice(0, 10)}.json`;
    enlace.click();
    URL.revokeObjectURL(url);
  }, [plan, noches]);

  const proxima = useMemo(() => {
    const alarma = alarmsEnCurso(alarmas, ahora);
    if (!alarma) return null;
    return { ...alarma, cuando: instanteParaEje(alarma.enEje, ahora), falta: cuantoFalta(alarma, ahora) };
  }, [alarmas, ahora]);

  return {
    permiso,
    pedirPermiso,
    alarmas,
    proxima,
    responder,
    refrescar,
    cerrarAviso,
    dispararPrueba,
    exportar,
  };
}

/** La alarma que todavía no sonó en este ciclo. */
function alarmsEnCurso(alarmas, ahora) {
  const ejeActual = enEje(ahora);
  return (
    alarmas.find((a) => a.enEje > ejeActual) ?? alarmas[0] ?? null
  );
}

export { nocheDe };