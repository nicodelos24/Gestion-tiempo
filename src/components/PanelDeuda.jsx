import { Panel, Cifra, Pill } from "./ui";
import { etiquetaDia, formatearDuracion, formatearDuracionCorta } from "../lib/tiempo";
import { FACTOR_RECUPERACION } from "../lib/sueno";

export default function PanelDeuda({ sueno }) {
  const { ventana, deudaMin, diasParaSanar, historial } = sueno;

  const completas = historial.filter((n) => n.completa);
  const maximo = Math.max(
    120,
    ...ventana.map((d) => (d.desfase != null ? Math.abs(d.desfase) : 0)),
    ...completas.map((n) => Math.abs(n.falta ?? 0))
  );

  const altura = (min) => {
    if (min == null) return 3;
    return Math.max(6, (Math.abs(min) / maximo) * 100);
  };

  const color = (dia) => {
    if (dia.futuro || dia.desfase == null) return "rgba(255,255,255,0.08)";
    if (dia.desfase > 60) return "var(--rosa)";
    if (dia.desfase > 0) return "var(--ambar)";
    return "var(--verde)";
  };

  const enPaz = deudaMin <= 0;

  return (
    <>
      <Panel
        titulo="Deuda de sueño"
        sub="Cada noche se compara con tu objetivo. Lo que te pasás se acumula; lo que te adelantás se descuenta 1,5 veces más rápido, porque recuperar es más rápido que perder."
      >
        <div className="rejilla rejilla-3" style={{ marginBottom: 8 }}>
          <Cifra
            valor={formatearDuracion(Math.abs(deudaMin))}
            etiqueta={enPaz ? "sin deuda acumulada" : "deuda acumulada"}
            clase={enPaz ? "acento-verde" : "acento-rosa"}
          />
          <Cifra
            valor={
              diasParaSanar === 0
                ? "Listo"
                : diasParaSanar === Infinity
                  ? "Sin ritmo"
                  : `${diasParaSanar} ${diasParaSanar === 1 ? "noche" : "noches"}`
            }
            etiqueta="a este ritmo, en estar en paz"
            clase="acento-cian"
          />
          <Cifra
            valor={`${FACTOR_RECUPERACION}x`}
            etiqueta="recuperación por noche adelantada"
            clase="acento-verde"
          />
        </div>

        <div className="barras">
          {ventana.map((dia) => {
            const valor = dia.desfase != null ? dia.desfase : dia.falta;
            return (
              <div className="barra-col" key={dia.fecha}>
                <div className="barra-detalle mono">
                  {valor == null ? "" : formatearDuracionCorta(valor)}
                </div>
                <div
                  className="barra"
                  style={{
                    height: `${altura(valor)}%`,
                    background: color(dia),
                    opacity: dia.futuro ? 0.35 : 1,
                  }}
                  title={`${etiquetaDia(dia.fecha)}: ${formatearDuracion(dia.desfase ?? 0)} de retraso`}
                />
                <div className="barra-detalle">{etiquetaDia(dia.fecha).slice(0, 3)}</div>
              </div>
            );
          })}
        </div>

        <p className="nota" style={{ marginTop: 16 }}>
          {enPaz ? (
            <>
              <Pill color="var(--verde)">en paz</Pill> No tenés deuda. A partir de acá, cada noche
              adelantada te da margen para las noches difíciles, que siempre llegan.
            </>
          ) : (
            <>
              <Pill color="var(--rosa)">en deuda</Pill> No es una multa: es el tiempo que le
              estás pidiendo al cuerpo mañana. Pagás con menos foco, más mal genio y menos ganas de
              hacer nada.
            </>
          )}
        </p>
      </Panel>
    </>
  );
}