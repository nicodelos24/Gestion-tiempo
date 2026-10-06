import { formatearHora } from "../lib/tiempo";

export function Panel({ titulo, sub, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      {titulo ? <h2 className="panel-titulo">{titulo}</h2> : null}
      {sub ? <p className="panel-sub">{sub}</p> : null}
      {children}
    </section>
  );
}

export function Cifra({ valor, etiqueta, clase = "", grande = false }) {
  return (
    <div>
      <div className={`cifra mono ${grande ? "cifra-grande" : ""} ${clase}`}>{valor}</div>
      {etiqueta ? <div className="cifra-etiqueta">{etiqueta}</div> : null}
    </div>
  );
}

export function Pill({ children, color = "var(--texto-suave)" }) {
  return (
    <span className="etiqueta-pill mono" style={{ color }}>
      <span className="punto" />
      {children}
    </span>
  );
}

export function Anillo({ valor, maximo = 100, tamano = 132, grosor = 10, color = "var(--violeta)", children }) {
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const proporcion = Math.max(0, Math.min(1, valor / maximo));
  return (
    <div style={{ position: "relative", width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} className="anillo">
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={grosor}
        />
        <circle
          className="anillo-circ"
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          stroke={color}
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - proporcion)}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function Boton({ children, onClick, variante = "", mini = false, fantasma = false }) {
  const clases = ["boton"];
  if (variante === "primario") clases.push("boton-primario");
  if (mini) clases.push("boton-mini");
  if (fantasma) clases.push("boton-fantasma");
  return (
    <button type="button" className={clases.join(" ")} onClick={onClick}>
      {children}
    </button>
  );
}

export function Deslizador({ etiqueta, valor, alCambiar, tono = "var(--texto)" }) {
  return (
    <div className="fila">
      <span style={{ fontSize: 14 }}>{etiqueta}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <input
          type="range"
          min={0}
          max={960}
          step={15}
          value={valor}
          onChange={(e) => alCambiar(Number(e.target.value))}
          style={{ width: 140 }}
        />
        <span className="mono" style={{ minWidth: 62, textAlign: "right", color: tono, fontSize: 14 }}>
          {formatearHora(valor)}
        </span>
      </div>
    </div>
  );
}