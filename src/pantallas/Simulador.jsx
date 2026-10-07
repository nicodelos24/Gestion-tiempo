import { useState } from "react";
import { levantarsePrevisto, costeDeTrasnocho, FRANJA_CRITICA } from "../nucleo/calculos.js";
import { formatearHora, formatearDuracion } from "../nucleo/reloj.js";

/**
 * La pregunta que la app responde mejor que nadie:
 * "¿qué pasa si me acuesto más tarde?"
 * Mueve la hora de acostarse y muestra, sin adornos, a qué hora te
 * levantás y qué te cuesta.
 */
export function Simulador({ plan }) {
  const [acostarse, setAcostarse] = useState(plan.dormirObjetivo + 60);

  const previsto = levantarsePrevisto(acostarse, plan);
  const retraso = acostarse - plan.dormirObjetivo;
  const coste = costeDeTrasnocho(Math.max(0, retraso), plan);
  const enFranjaCritica =
    retraso > 0 &&
    acostarse - retraso / 2 >= FRANJA_CRITICA.desde &&
    acostarse + retraso / 2 >= FRANJA_CRITICA.desde;

  const anclaFija = plan.modo === "anclado" ? plan.anclaDespertar : null;

  return (
    <div
      style={{
        padding: 18,
        borderRadius: 16,
        background: "rgba(124,108,255,0.07)",
        border: "1px solid rgba(124,108,255,0.24)",
      }}
    >
      <div className="fila" style={{ borderBottom: 0, paddingBottom: 10 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>Simulación</span>
        <span className="cifra" style={{ fontSize: 20, color: "var(--color-plan)" }}>
          {formatearHora(acostarse)}
        </span>
      </div>

      <input
        className="deslizador"
        type="range"
        min={plan.dormirObjetivo - 120}
        max={plan.dormirObjetivo + 300}
        step={15}
        value={acostarse}
        onChange={(e) => setAcostarse(Number(e.target.value))}
        aria-label="Hora en la que te acostarías"
      />

      <div className="rejilla rejilla-3" style={{ marginTop: 16 }}>
        <div>
          <div className="cifra" style={{ fontSize: 22, color: "var(--color-pagando)" }}>
            {formatearHora(previsto)}
          </div>
          <div className="cifra-nota">te levantarías</div>
        </div>
        <div>
          <div className="cifra" style={{ fontSize: 22, color: retraso > 0 ? "var(--color-perdido)" : "var(--color-recuperado)" }}>
            {retraso === 0 ? "en hora" : formatearDuracion(Math.abs(retraso))}
          </div>
          <div className="cifra-nota">{retraso > 0 ? "más tarde" : retraso < 0 ? "más temprano" : ""}</div>
        </div>
        <div>
          <div className="cifra" style={{ fontSize: 22, color: "var(--color-querido)" }}>
            {retraso > 0 ? `−${Math.round(coste * 0.8)}` : "0"}
          </div>
          <div className="cifra-nota">puntos de energía</div>
        </div>
      </div>

      {anclaFija != null && Math.abs(previsto - anclaFija) > 30 ? (
        <p className="nota" style={{ marginBottom: 0, marginTop: 14 }}>
          Tenés el despertar anclado a las {formatearHora(anclaFija)}. Si te acostás a las{" "}
          {formatearHora(acostarse)}, dormís {formatearDuracion(anclaFija - acostarse)} menos de lo
          previsto y eso se convierte en deuda.
        </p>
      ) : null}

      {enFranjaCritica ? (
        <p className="nota" style={{ marginBottom: 0, marginTop: 10 }}>
          La mitad de ese retraso cae entre las {formatearHora(FRANJA_CRITICA.desde)} y las{" "}
          {formatearHora(FRANJA_CRITICA.hasta)}: la franja más cara de la noche.
        </p>
      ) : null}
    </div>
  );
}
