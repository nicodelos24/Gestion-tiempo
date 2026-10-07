import { franjasDeNoche, clasificarFranja } from "../nucleo/calculos.js";
import { INICIO_NOCHE } from "../nucleo/reloj.js";

/**
 * La noche entera, en una sola tira: donde dormiste, donde estabas
 * despierto cuando no era hora, y lo que todavía no pasó.
 */
export function CintaNoche({ plan, analisis, ahoraEje }) {
  const franjas = franjasDeNoche(plan);
  const inicio = franjas[0].inicio;
  const fin = franjas[franjas.length - 1].fin;
  const pos = (min) => `${((min - inicio) / (fin - inicio)) * 100}%`;

  const ticks = franjas.filter((f) => f.inicio % 60 === 0);
  const mostrarAhora = ahoraEje != null && ahoraEje >= inicio && ahoraEje <= fin;

  return (
    <div>
      <div className="cinta">
        {franjas.map((franja) => (
          <div
            key={franja.inicio}
            className="tramo"
            data-estado={clasificarFranja(franja, analisis, ahoraEje)}
            title={`${franja.inicio / 60 % 24}:00`}
          />
        ))}

        <div className="eje-hora eje-plan" style={{ left: pos(plan.dormirObjetivo) }} data-rotulo={`tu hora ${hora(plan.dormirObjetivo)}`} />
        {analisis?.previsto != null && analisis.previsto !== plan.dormirObjetivo ? (
          <div className="eje-hora eje-previsto" style={{ left: pos(analisis.previsto) }} data-rotulo={`previsto ${hora(analisis.previsto)}`} />
        ) : null}
      </div>

      <div className="eje">
        {ticks.map((f) => (
          <span key={f.inicio} className="eje-tick" style={{ left: pos(f.inicio) }}>
            {hora(f.inicio)}
          </span>
        ))}
      </div>

      <div className="nota" style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 14 }}>
        <Leyenda color="#7c6cff" texto="Dormido" />
        <Leyenda color="rgba(255,179,92,0.85)" texto="Despierto cuando tocaba dormir" />
        <Leyenda color="rgba(255,255,255,0.55)" texto="Todavía no ocurre" />
        {mostrarAhora ? <Leyenda color="#ffffff" texto="Ahora" /> : null}
      </div>
    </div>
  );
}

function hora(min) {
  const total = (1080 + min) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:00`;
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

export { INICIO_NOCHE };
