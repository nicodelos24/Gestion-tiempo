import { useEffect, useState } from "react";
import { Panel, Cifra, Boton, Pill, Anillo } from "./ui";
import CintaNoche from "./CintaNoche";
import { formatearHora, formatearDuracion, minutosDesde18 } from "../lib/tiempo";
import { VENTANA_CRITICA } from "../lib/sueno";

function useReloj() {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 20000);
    return () => clearInterval(id);
  }, []);
  return ahora;
}

export default function PanelHoy({ sueno }) {
  const { analisisHoy, ajustes, acciones, energia } = sueno;
  const ahora = useReloj();
  const ahoraMin = minutosDesde18(ahora);

  const fueraDeRango = ahoraMin < ajustes.dormir - 60;
  const tarde = ahora.getHours() >= 20 || ahora.getHours() < 5;

  const hora = ahoraMin == null ? "--:--" : formatearHora(ahoraMin);

  return (
    <>
      <Panel
        titulo="Ahora mismo"
        sub="Tu noche no se mide en horas que dormiste, sino en las que aún no empezaste a dormir."
      >
        <div className="rejilla rejilla-3" style={{ alignItems: "center" }}>
          <Cifra
            valor={hora}
            etiqueta={tarde ? "la noche sigue abierta" : "fuera de la noche"}
            clase={`${tarde ? "acento-violeta" : ""} ${fueraDeRango ? "acento-rosa" : ""}`}
            grande
          />
          <Cifra
            valor={
              analisisHoy.dormir != null
                ? formatearHora(analisisHoy.dormir)
                : "--:--"
            }
            etiqueta="hora de acostarte"
            clase="acento-cian"
          />
          <Cifra
            valor={
              analisisHoy.levantar != null
                ? formatearHora(analisisHoy.levantar)
                : formatearHora(ajustes.despertar)
            }
            etiqueta={analisisHoy.levantar != null ? "hora de levantarte" : "previsto si sigues el plan"}
            clase="acento-ambar"
          />
        </div>

        <div className="grupo-botones" style={{ marginTop: 22 }}>
          <Boton
            variante="primario"
            onClick={() => acciones.actualizarNoche("dormir", ahoraMin)}
          >
            Me acosté ahora
          </Boton>
          <Boton onClick={() => acciones.actualizarNoche("levantar", ahoraMin)}>
            Me levanté ahora
          </Boton>
          <Boton mini onClick={() => acciones.ajustarNoche("dormir", -30)}>
            30 min antes
          </Boton>
          <Boton mini onClick={() => acciones.ajustarNoche("dormir", 30)}>
            30 min después
          </Boton>
          {(analisisHoy.dormir != null || analisisHoy.levantar != null) && (
            <Boton mini fantasma onClick={acciones.borrarNocheHoy}>
              Borrar
            </Boton>
          )}
        </div>

        <CintaNoche
          analisis={analisisHoy}
          ahoraMin={tarde ? ahoraMin : null}
          ajustes={ajustes}
        />
      </Panel>

      <Panel titulo="La cuenta de esta noche">
        <div className="rejilla rejilla-2" style={{ alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <Anillo
              valor={energia}
              color={energia > 70 ? "var(--verde)" : energia > 40 ? "var(--ambar)" : "var(--rosa)"}
            >
              <div>
                <div className="cifra mono">{energia}</div>
                <div className="cifra-etiqueta">energía prevista</div>
              </div>
            </Anillo>
            <div style={{ maxWidth: 220 }}>
              <Pill color={energia > 70 ? "var(--verde)" : energia > 40 ? "var(--ambar)" : "var(--rosa)"}>
                mañana
              </Pill>
              <p className="nota" style={{ marginTop: 12 }}>
                La energía de mañana no se recupera con café: se decide en las horas que elegís
                seguir despierto.
              </p>
            </div>
          </div>

          <div>
            <div className="fila">
              <span style={{ fontSize: 14 }}>Te acostaste</span>
              <span className="mono" style={{ fontSize: 14 }}>
                {analisisHoy.dormir != null ? formatearHora(analisisHoy.dormir) : "--:--"}
              </span>
            </div>
            <div className="fila">
              <span style={{ fontSize: 14 }}>Objetivo</span>
              <span className="mono" style={{ fontSize: 14, color: "var(--cian)" }}>
                {formatearHora(ajustes.dormir)}
              </span>
            </div>
            <div className="fila">
              <span style={{ fontSize: 14 }}>Horas de más</span>
              <span
                className="mono"
                style={{
                  fontSize: 14,
                  color: analisisHoy.inversion > 0 ? "var(--rosa)" : "var(--verde)",
                }}
              >
                {analisisHoy.inversion > 0 ? `+${formatearDuracion(analisisHoy.inversion)}` : "0 min"}
              </span>
            </div>
            <div className="fila">
              <span style={{ fontSize: 14 }}>Te levantas</span>
              <span className="mono" style={{ fontSize: 14, color: "var(--ambar)" }}>
                {formatearHora(analisisHoy.despertarPrevisto ?? ajustes.despertar)}
              </span>
            </div>
          </div>
        </div>

        {analisisHoy.inversion > 0 ? (
          <div
            style={{
              marginTop: 20,
              padding: "14px 16px",
              borderRadius: 14,
              background: "rgba(255,107,139,0.08)",
              border: "1px solid rgba(255,107,139,0.25)",
            }}
          >
            <p className="nota" style={{ margin: 0, color: "var(--texto)" }}>
              <strong style={{ color: "var(--rosa)" }}>
                {formatearDuracion(analisisHoy.inversion)} de más.
              </strong>{" "}
              Eso empuja tu despertar a las {formatearHora(analisisHoy.despertarPrevisto)} y te
              cuesta <strong>{Math.round(analisisHoy.energiaPerdida)} puntos de energía</strong> mañana.
              {analisisHoy.costoCritico ? (
                <>
                  {" "}
                  Parte de esas horas caen entre las {formatearHora(VENTANA_CRITICA.desde)} y las{" "}
                  {formatearHora(VENTANA_CRITICA.hasta)}, cuando el cuerpo está en su punto más bajo
                  de vigilancia: ahí despertar cuesta el doble.
                </>
              ) : null}
            </p>
          </div>
        ) : (
          <div
            style={{
              marginTop: 20,
              padding: "14px 16px",
              borderRadius: 14,
              background: "rgba(74,222,154,0.07)",
              border: "1px solid rgba(74,222,154,0.22)",
            }}
          >
            <p className="nota" style={{ margin: 0, color: "var(--texto)" }}>
              {analisisHoy.dormir != null
                ? "Vas en hora. Cada hora que respetas se convierte en horas de referencia: tu cuerpo empieza a anticipar el final del día."
                : "Todavía no has anotado cuándo te acostaste. La noche empieza a contarse sola desde las 18:00."}
            </p>
          </div>
        )}
      </Panel>
    </>
  );
}