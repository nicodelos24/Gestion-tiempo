import { franjasDeNoche, clasificarFranja, VENTANA_CRITICA } from "../lib/sueno";
import { formatearHora, ORIGEN_NOCHE } from "../lib/tiempo";

function posicionDe(min, ajustes) {
  const franjas = franjasDeNoche(ajustes);
  const inicio = franjas[0].inicio;
  const fin = franjas[franjas.length - 1].fin;
  return `${((min - inicio) / (fin - inicio)) * 100}%`;
}

export default function CintaNoche({ analisis, ahoraMin, ajustes }) {
  const franjas = franjasDeNoche(ajustes);

  const marcasEje = franjas
    .filter((f) => f.inicio % 60 === 0)
    .map((f) => ({ min: f.inicio, hora: formatearHora(f.inicio) }));

  const mostrarPrevisto = analisis.desfase != null && analisis.desfase > 0;

  return (
    <div style={{ position: "relative" }}>
      {/* Banda de hora crítica 01:00 - 04:00 */}
      <div
        style={{
          position: "absolute",
          left: posicionDe(VENTANA_CRITICA.desde, ajustes),
          width: `${((VENTANA_CRITICA.hasta - VENTANA_CRITICA.desde) / (franjas[franjas.length - 1].fin - franjas[0].inicio)) * 100}%`,
          top: -14,
          bottom: 26,
          background:
            "repeating-linear-gradient(180deg, rgba(255,107,139,0.16) 0 6px, transparent 6px 12px)",
          borderLeft: "1px solid rgba(255,107,139,0.35)",
          borderRight: "1px solid rgba(255,107,139,0.35)",
          borderRadius: 8,
          pointerEvents: "none",
        }}
        title="Zona crítica: entre la 01:00 y las 04:00 el cuerpo está en su punto más bajo de vigilancia. Despertar aquí cuesta el doble."
      />

      <div className="cinta">
        {franjas.map((franja) => (
          <div
            key={franja.inicio}
            className="tramo"
            data-estado={clasificarFranja(franja, analisis, ahoraMin)}
            title={`${formatearHora(franja.inicio)} - ${formatearHora(franja.fin)}`}
          />
        ))}

        <div
          className="marca-linea marca-objetivo"
          style={{ left: posicionDe(ajustes.dormir, ajustes) }}
          data-rotulo={`objetivo ${formatearHora(ajustes.dormir)}`}
        />
        {mostrarPrevisto ? (
          <div
            className="marca-linea marca-previsto"
            style={{ left: posicionDe(analisis.despertarPrevisto, ajustes) }}
            data-rotulo={`previsto ${formatearHora(analisis.despertarPrevisto)}`}
          />
        ) : null}
      </div>

      <div className="eje">
        {marcasEje.map((m) => (
          <span key={m.min} className="eje-marca mono" style={{ left: posicionDe(m.min, ajustes) }}>
            {m.hora}
          </span>
        ))}
      </div>

      <div
        className="nota"
        style={{ marginTop: 14, display: "flex", gap: 18, flexWrap: "wrap" }}
      >
        <Leyenda color="#6f5cff" texto="Dormido" />
        <Leyenda color="rgba(255,179,92,0.8)" texto="Despierto de más" />
        <Leyenda color="rgba(255,255,255,0.5)" texto="Lo que todavía no ocurre" />
        <Leyenda color="rgba(255,107,139,0.8)" texto="Zona crítica 01:00 - 04:00" />
      </div>
    </div>
  );
}

function Leyenda({ color, texto }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span
        style={{ width: 10, height: 10, borderRadius: 3, background: color, display: "inline-block" }}
      />
      {texto}
    </span>
  );
}

export { ORIGEN_NOCHE };