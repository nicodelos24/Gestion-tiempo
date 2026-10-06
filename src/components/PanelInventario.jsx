import { Panel, Cifra } from "./ui";
import { formatearDuracion } from "../lib/tiempo";
import { costeDeInversion, costeDesde, COSTE_HORA_TARDE, COSTE_HORA_CRITICA, VENTANA_CRITICA } from "../lib/sueno";

export default function PanelInventario({ sueno }) {
  const { analisisHoy, ajustes, presupuestoNoche, historial, acciones } = sueno;

  const durmido = analisisHoy.durmido ?? 0;
  const restante = Math.max(0, presupuestoNoche - durmido);
  const gastadoPct = Math.min(100, (durmido / presupuestoNoche) * 100);

  // Un día concreto como ejemplo del precio de cada hora perdida.
  const desglose = [
    { etiqueta: "Hora tardía", min: 90, costo: COSTE_HORA_TARDE, color: "var(--ambar)" },
    { etiqueta: "Hora crítica (01:00-04:00)", min: 60, costo: COSTE_HORA_CRITICA, color: "var(--rosa)" },
    { etiqueta: "Hora tardía", min: 30, costo: COSTE_HORA_TARDE, color: "var(--ambar)" },
  ];
  const totalEjemplo = desglose.reduce((s, d) => s + (d.min / 60) * d.costo, 0);

  const ultimas = historial.filter((n) => n.completa).slice(-5);
  const consumoPromedio = ultimas.length
    ? ultimas.reduce((s, n) => s + (n.inversion ?? 0), 0) / ultimas.length
    : 0;

  return (
    <>
      <Panel
        titulo="Inventario de la noche"
        sub="Tu noche es un recurso con una cantidad fija de horas. Cada hora que sigues despierto la consume: no desaparece, se gasta."
      >
        <div className="rejilla rejilla-2" style={{ alignItems: "end" }}>
          <div>
            <div className="inventario" title="Progreso del inventario nocturno">
              <div className="inventario-relleno" style={{ width: `${gastadoPct}%` }} />
            </div>
            <div
              className="nota mono"
              style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}
            >
              <span>{formatearDuracion(durmido)} usadas</span>
              <span>{formatearDuracion(restante)} restantes</span>
            </div>
          </div>
          <div className="rejilla rejilla-3">
            <Cifra
              valor={formatearDuracion(presupuestoNoche)}
              etiqueta="presupuesto de la noche"
              clase="acento-violeta"
            />
            <Cifra
              valor={formatearDuracion(restante)}
              etiqueta="aún sin gastar"
              clase={restante > 0 ? "acento-cian" : "acento-rosa"}
            />
            <Cifra
              valor={formatearDuracion(consumoPromedio)}
              etiqueta="consumo medio por noche"
              clase={consumoPromedio > 0 ? "acento-ambar" : "acento-verde"}
            />
          </div>
        </div>

        <p className="nota" style={{ marginTop: 18 }}>
          Objetivo actual: acostarte a las{" "}
          <span className="mono" style={{ color: "var(--cian)" }}>
            {formatearDuracion(ajustes.dormir)}
          </span>{" "}
          es la hora exacta; desde ahí empieza a contar tu presupuesto. Ajustalo abajo cuando quieras.
        </p>

        <div className="grupo-botones" style={{ marginTop: 14 }}>
          <BotonAjuste etiqueta="Dormir 30 min antes" onClick={() => acciones.ajustarAjuste("dormir", -30)} />
          <BotonAjuste etiqueta="Dormir 30 min después" onClick={() => acciones.ajustarAjuste("dormir", 30)} />
          <BotonAjuste etiqueta="Levantar 30 min antes" onClick={() => acciones.ajustarAjuste("despertar", -30)} />
          <BotonAjuste etiqueta="Levantar 30 min después" onClick={() => acciones.ajustarAjuste("despertar", 30)} />
        </div>
      </Panel>

      <Panel
        titulo="El precio de la hora"
        sub="No todas las horas perdidas cuestan lo mismo. Entre la 01:00 y las 04:00 tu cuerpo está en su nadir de vigilancia: despertarse ahí te saca del sueño profundo y cuesta casi el doble."
      >
        <div className="rejilla rejilla-2" style={{ alignItems: "start" }}>
          <div>
            <div className="nota mono" style={{ marginBottom: 12 }}>
              Una noche 3 horas más tarde:
            </div>
            {desglose.map((d, i) => (
              <div className="fila" key={i}>
                <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14 }}>
                  <span className="punto" style={{ color: d.color }} />
                  {d.etiqueta} · {d.min} min
                </span>
                <span className="mono" style={{ fontSize: 14, color: d.color }}>
                  -{((d.min / 60) * d.costo).toFixed(1)} pts
                </span>
              </div>
            ))}
            <div className="fila" style={{ borderBottom: 0, paddingTop: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Total</span>
              <span className="mono" style={{ fontSize: 16, color: "var(--rosa)" }}>
                -{totalEjemplo.toFixed(1)} pts
              </span>
            </div>
          </div>

          <div>
            <div className="nota mono" style={{ marginBottom: 12 }}>
              Mismo retraso, distinto momento:
            </div>
            {[
              { etiqueta: "Te acostás 3 h tarde y dormís igual", costo: costeDeInversion(180) },
              {
                etiqueta: "Las mismas 3 h caen en la zona crítica",
                costo: costeDesde(VENTANA_CRITICA.desde, 180),
              },
            ].map((fila, i) => (
              <div className="fila" key={i}>
                <span style={{ fontSize: 14 }}>{fila.etiqueta}</span>
                <span
                  className="mono"
                  style={{ fontSize: 14, color: i === 0 ? "var(--ambar)" : "var(--rosa)" }}
                >
                  -{fila.costo.toFixed(1)} pts
                </span>
              </div>
            ))}
            <p className="nota" style={{ marginTop: 16 }}>
              La misma cantidad de horas, distinto precio. Por eso el objetivo no es solo{" "}
              <em>dormir tarde</em>: es <em>cuándo</em>.
            </p>
          </div>
        </div>
      </Panel>
    </>
  );
}

function BotonAjuste({ etiqueta, onClick }) {
  return (
    <button type="button" className="boton boton-mini" onClick={onClick}>
      {etiqueta}
    </button>
  );
}