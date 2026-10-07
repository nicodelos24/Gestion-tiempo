import { Tarjeta, Cifra, Aviso, Pastilla } from "../ui/Tarjeta.jsx";
import { Boton, Botones } from "../ui/Boton.jsx";
import { DeslizadorHora, DeslizadorDuracion } from "../ui/Controles.jsx";
import { levantarsePrevisto } from "../nucleo/calculos.js";
import { DURACION_MIN, DURACION_MAX } from "../nucleo/modelo.js";
import { formatearHora, formatearDuracion } from "../nucleo/reloj.js";

export function PantallaPlan({ sueno, ciclo }) {
  const { plan, ajustes, acciones } = sueno;
  const { setPlan, setAjuste } = acciones;

  const previstoEnPlan = levantarsePrevisto(plan.dormirObjetivo, plan);

  return (
    <>
      <Tarjeta
        titulo="Tu plan"
        bajada="Dos decisiones y nada más: a qué hora querés estar acostado y cuánto querés dormir. Todo lo demás se deduce de ahí."
      >
        <DeslizadorHora
          etiqueta="Hora en la que querés estar acostado"
          valor={plan.dormirObjetivo}
          alCambiar={(v) => setPlan({ dormirObjetivo: v })}
          min={120}
          max={600}
        />

        <DeslizadorDuracion
          etiqueta="Cuánto querés dormir"
          valor={plan.duracionObjetivo}
          alCambiar={(v) => setPlan({ duracionObjetivo: v })}
          min={DURACION_MIN}
          max={DURACION_MAX}
          sufijo={formatearDuracion}
        />

        <div className="fila">
          <span style={{ fontSize: 14 }}>Cómo te levantás</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="boton boton-chico"
              aria-pressed={plan.modo === "flexible"}
              style={plan.modo === "flexible" ? { background: "rgba(124,108,255,0.2)", borderColor: "rgba(124,108,255,0.5)" } : {}}
              onClick={() => setPlan({ modo: "flexible" })}
            >
              Cuando me toque
            </button>
            <button
              className="boton boton-chico"
              aria-pressed={plan.modo === "anclado"}
              style={plan.modo === "anclado" ? { background: "rgba(124,108,255,0.2)", borderColor: "rgba(124,108,255,0.5)" } : {}}
              onClick={() => setPlan({ modo: "anclado" })}
            >
              Hora fija
            </button>
          </div>
        </div>

        {plan.modo === "anclado" ? (
          <DeslizadorHora
            etiqueta="Hora fija de levantarte"
            valor={plan.anclaDespertar}
            alCambiar={(v) => setPlan({ anclaDespertar: v })}
            min={240}
            max={1200}
            color="var(--color-pagando)"
          />
        ) : null}

        <div className="rejilla rejilla-3" style={{ marginTop: 22 }}>
          <Cifra valor={formatearHora(plan.dormirObjetivo)} nota="acostarse" color="var(--color-querido)" />
          <Cifra valor={formatearDuracion(plan.duracionObjetivo)} nota="de sueño" color="var(--color-plan)" />
          <Cifra
            valor={formatearHora(previstoEnPlan)}
            nota={plan.modo === "anclado" ? "te levantás siempre" : "si lo cumples"}
            color="var(--color-pagando)"
          />
        </div>

        {plan.modo === "flexible" ? (
          <Aviso tono="info">
            Elegiste <strong>cero hora fija</strong>: si te acostás a las 00:30, te levantás a las{" "}
            {formatearHora(levantarsePrevisto(30, plan))}. No hay deuda de sueño, pero tu día entero
            se corre. Si preferís dormir aunque sea un poco menos, cambiá a{" "}
            <strong>hora fija</strong>.
          </Aviso>
        ) : (
          <Aviso tono="info">
            Elegiste <strong>hora fija</strong>: te levantás a las {formatearHora(plan.anclaDespertar)}{" "}
            siempre. Si te acostás tarde, dormís menos y eso queda anotado como deuda.
          </Aviso>
        )}
      </Tarjeta>

      <Tarjeta
        titulo="Avisos"
        bajada="La app te avisa antes de tu hora para que la decisión sea fácil, y a la mañana te pregunta a qué hora te levantaste para cerrar el registro."
      >
        {ciclo.permiso !== "granted" ? (
          <Aviso tono={ciclo.permiso === "denied" ? "mal" : "medio"}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ flex: "1 1 260px" }}>
                {ciclo.permiso === "denied"
                  ? "Las notificaciones están bloqueadas. Habilitalas desde el candado de la barra de direcciones para recibir los avisos."
                  : "Sin permiso de notificaciones. Sin esto la app no te puede avisar, y la mitad de la idea se pierde."}
              </span>
              {ciclo.permiso === "denied" ? null : (
                <Boton variante="principal" onClick={ciclo.pedirPermiso}>
                  Activar avisos
                </Boton>
              )}
            </div>
          </Aviso>
        ) : (
          <Aviso tono="ok">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ flex: "1 1 260px" }}>
                Avisos activados. El próximo suena {ciclo.proxima ? `a las ${formatearHora(ciclo.proxima.enEje)}, ${ciclo.proxima.falta}` : "cuando programes tu plan"}.
              </span>
              <Boton onClick={() => ciclo.dispararPrueba()}>Probar un aviso</Boton>
            </div>
          </Aviso>
        )}

        <div style={{ marginTop: 20 }}>
          <DeslizadorDuracion
            etiqueta="Avisar antes de la hora de dormir"
            valor={ajustes.avisoPrevio}
            alCambiar={(v) => setAjuste({ avisoPrevio: v })}
            min={0}
            max={120}
            sufijo={formatearDuracion}
          />
          <DeslizadorDuracion
            etiqueta="Cuánto posterga el botón 'en X minutos'"
            valor={ajustes.posponerMin}
            alCambiar={(v) => setAjuste({ posponerMin: Math.max(5, v) })}
            min={5}
            max={90}
            sufijo={formatearDuracion}
          />
          <DeslizadorDuracion
            etiqueta="Avisar antes de la hora de levantarse"
            valor={ajustes.avisoTarde}
            alCambiar={(v) => setAjuste({ avisoTarde: v })}
            min={0}
            max={120}
            sufijo={formatearDuracion}
          />
        </div>

        <div style={{ marginTop: 18 }}>
          <Pastilla color="var(--color-plan)">
            {formatearHora((plan.dormirObjetivo - ajustes.avisoPrevio + 1440) % 1440)} · aviso de dormir
          </Pastilla>{" "}
          <span style={{ marginLeft: 8 }}>
            <Pastilla color="var(--color-pagando)">
              {formatearHora((previstoEnPlan - ajustes.avisoTarde + 1440) % 1440)} · aviso de levantarse
            </Pastilla>
          </span>
        </div>

        <p className="nota" style={{ marginTop: 16, marginBottom: 0 }}>
          Los temporizadores viven en la pestaña del navegador. Si cerrás la app, el aviso te espera
          cuando la vuelvas a abrir. Dejala abierta en una pestaña aparte si querés que suene sola.
        </p>
      </Tarjeta>

      <Tarjeta titulo="Datos">
        <p className="nota" style={{ marginTop: 0 }}>
          Todo se guarda en este navegador. Nada sale de tu dispositivo.
        </p>
        <Botones>
          <Boton onClick={ciclo.exportar}>
            Descargar mis datos (JSON)
          </Boton>
          <Boton fantasma onClick={acciones.reiniciar}>
            Borrar todo el historial
          </Boton>
        </Botones>
      </Tarjeta>
    </>
  );
}
