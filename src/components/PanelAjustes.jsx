import { Panel, Boton, Deslizador } from "./ui";
import { formatearDuracion } from "../lib/tiempo";

export default function PanelAjustes({ sueno }) {
  const { ajustes, acciones, historial, presupuestoNoche } = sueno;

  const noches = historial.filter((n) => n.completa).length;

  return (
    <>
      <Panel
        titulo="Tu punto de partida"
        sub="El objetivo no es una regla dura: es la referencia con la que se mide todo lo demás. Cuanto más realista, más útil."
      >
        <Deslizador
          etiqueta="Hora objetivo de acostarte"
          valor={ajustes.dormir}
          alCambiar={(v) => acciones.ajustarAjuste("dormir", v - ajustes.dormir)}
          tono="var(--cian)"
        />
        <Deslizador
          etiqueta="Hora objetivo de levantarte"
          valor={ajustes.despertar}
          alCambiar={(v) => acciones.ajustarAjuste("despertar", v - ajustes.despertar)}
          tono="var(--ambar)"
        />

        <div className="rejilla rejilla-3" style={{ marginTop: 20 }}>
          <div>
            <div className="cifra mono acento-violeta">{formatearDuracion(presupuestoNoche)}</div>
            <div className="cifra-etiqueta">de presupuesto nocturno</div>
          </div>
          <div>
            <div className="cifra mono">{noches}</div>
            <div className="cifra-etiqueta">noches registradas</div>
          </div>
          <div>
            <div className="cifra mono">{historial.length ? "—" : "0"}</div>
            <div className="cifra-etiqueta">días sin datos</div>
          </div>
        </div>
      </Panel>

      <Panel
        titulo="Cómo usar esto"
        sub="Tres movimientos, en este orden."
      >
        <div className="fila">
          <span style={{ fontSize: 14 }}>
            <strong style={{ color: "var(--violeta)" }}>1. Anotá.</strong> Cuando te acostés y
            cuando te levantes. No importa la precisión: importa que exista.
          </span>
        </div>
        <div className="fila">
          <span style={{ fontSize: 14 }}>
            <strong style={{ color: "var(--cian)" }}>2. Mirá el desplazamiento.</strong> La línea
            naranja es tu hora real de despertar. La cian es la que querías. Todo lo que hay entre
            las dos lo pagaste vos.
          </span>
        </div>
        <div className="fila">
          <span style={{ fontSize: 14 }}>
            <strong style={{ color: "var(--ambar)" }}>3. Adelantá 10, no 60.</strong> Saltar de
            golpe es una siesta a destiempo. Adelantá de a poco.
          </span>
        </div>
      </Panel>

      <Panel titulo="Datos">
        <p className="nota" style={{ marginTop: 0 }}>
          Todo se guarda solo en este navegador. Nada sale de tu dispositivo.
        </p>
        <div className="grupo-botones">
          <Boton fantasma onClick={acciones.reiniciar}>
            Borrar todo el historial
          </Boton>
        </div>
      </Panel>
    </>
  );
}