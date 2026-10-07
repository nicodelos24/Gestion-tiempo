import { formatearHora } from "../nucleo/reloj.js";

/** Deslizador con etiqueta y valor en hora de reloj. */
export function DeslizadorHora({ etiqueta, valor, alCambiar, min = 0, max = 1439, paso = 15, color = "var(--color-querido)" }) {
  return (
    <div className="fila">
      <span style={{ fontSize: 14 }}>{etiqueta}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 240 }}>
        <input
          className="deslizador"
          type="range"
          min={min}
          max={max}
          step={paso}
          value={valor}
          onChange={(e) => alCambiar(Number(e.target.value))}
        />
        <span className="cifra" style={{ fontSize: 17, minWidth: 58, textAlign: "right", color }}>
          {formatearHora(valor)}
        </span>
      </div>
    </div>
  );
}

/** Deslizador de duración, expresado en horas y media hora. */
export function DeslizadorDuracion({ etiqueta, valor, alCambiar, min, max, sufijo }) {
  return (
    <div className="fila">
      <span style={{ fontSize: 14 }}>{etiqueta}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 240 }}>
        <input
          className="deslizador"
          type="range"
          min={min}
          max={max}
          step={30}
          value={valor}
          onChange={(e) => alCambiar(Number(e.target.value))}
        />
        <span className="cifra" style={{ fontSize: 17, minWidth: 58, textAlign: "right", color: "var(--color-plan)" }}>
          {sufijo(valor)}
        </span>
      </div>
    </div>
  );
}

/** Campo de hora libre: se escribe "23:30" y se traduce al eje de la noche. */
export function CampoHora({ etiqueta, valor, alCambiar, color = "#e9edf8" }) {
  return (
    <label className="fila" style={{ cursor: "text" }}>
      <span style={{ fontSize: 14 }}>{etiqueta}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="cifra" style={{ fontSize: 16, color }}>{formatearHora(valor)}</span>
        <input
          className="campo-hora"
          type="time"
          value={formatearHora(valor)}
          onChange={(e) => {
            const [h, m] = e.target.value.split(":").map(Number);
            if (!Number.isNaN(h)) alCambiar(h >= 18 || h < 10 ? ((h * 60 + m - 1080 + 1440) % 1440) : h * 60 + m - 1080);
          }}
        />
      </div>
    </label>
  );
}
