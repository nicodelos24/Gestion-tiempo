import { Tarjeta, Cifra, Pastilla, Aviso } from "../ui/Tarjeta.jsx";
import { Boton, Botones } from "../ui/Boton.jsx";
import { Anillo } from "../ui/Anillo.jsx";
import { CintaNoche } from "../ui/CintaNoche.jsx";
import { Simulador } from "./Simulador.jsx";
import { levantarsePrevisto, FRANJA_CRITICA } from "../nucleo/calculos.js";
import { formatearHora, formatearDuracion } from "../nucleo/reloj.js";
import { TIPOS } from "../servicios/alarmas.js";
import { useReloj } from "../hooks/useSueno.js";
import { useState } from "react";

export function PantallaHoy({ sueno, ciclo }) {
  const { plan, ajustes, analisisHoy, hoy, noches, acciones, energia, deudaMin, nochesParaSanar } = sueno;
  const [simulando, setSimulando] = useState(false);
  const { eje } = useReloj();
  const noche = noches?.[hoy];
  const acostado = analisisHoy.acostarse != null;
  const levantado = analisisHoy.levantarse != null;
  const retraso = acostado ? Math.max(0, analisisHoy.desfase) : Math.max(0, eje - plan.dormirObjetivo);
  const previsto = levantarsePrevisto(acostado ? analisisHoy.acostarse : eje, plan);

  const tonoEnergia = energia > 70 ? "var(--color-recuperado)" : energia > 40 ? "var(--color-pagando)" : "var(--color-perdido)";

  return (
    <>
      <Tarjeta
        titulo="Ahora"
        bajada={
          acostado
            ? "Ya te acostaste. Lo que queda de la noche es tuyo: la app te avisa antes de la hora de levantarse."
            : "Todavía no te acostaste. Decime cuándo cuando te acuestes, y yo calculo a qué hora te levantás."
        }
      >
        <div className="rejilla rejilla-4" style={{ alignItems: "center" }}>
          <Cifra valor={formatearHora(eje)} nota="hora ahora" color="var(--color-plan)" />
          <Cifra
            valor={formatearHora(plan.dormirObjetivo)}
            nota="tu hora de dormir"
            color="var(--color-querido)"
          />
          <Cifra
            valor={previsto != null ? formatearHora(previsto) : "--:--"}
            nota={acostado ? "te levantás a las" : "si te acostás ahora"}
            color="var(--color-pagando)"
          />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Anillo valor={energia} color={tonoEnergia}>
              <div>
                <div className="cifra" style={{ color: tonoEnergia }}>{energia}</div>
                <div className="cifra-nota">energía<br />mañana</div>
              </div>
            </Anillo>
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <Botones>
            {!acostado ? (
              <Boton variante="principal" onClick={() => acciones.acostarse(hoy, eje)}>
                Ya me acosté
              </Boton>
            ) : (
              <Boton variante="principal" onClick={() => acciones.acostarse(hoy, eje)}>
                Corregir a las {formatearHora(eje)}
              </Boton>
            )}
            {acostado ? (
              <Boton onClick={() => acciones.levantarse(hoy, eje)}>
                Me levanté ahora
              </Boton>
            ) : null}
            <Boton
              onClick={() => {
                const alarma = ciclo.alarmas.find((a) => a.tipo === TIPOS.NOCHE);
                if (alarma) ciclo.responder("posponer");
                else acciones.acostarse(hoy, eje);
              }}
            >
              {ajustes.posponerMin} min más
            </Boton>
            <Boton fantasma onClick={() => setSimulando((v) => !v)}>
              {simulando ? "Ocultar simulación" : "¿Y si me acuesto más tarde?"}
            </Boton>
          </Botones>
        </div>

        {acostado && levantado ? (
          <div style={{ marginTop: 18 }}>
            <FilaValor etiqueta="Dormiste" valor={formatearDuracion(analisisHoy.durmido)} />
            <FilaValor
              etiqueta="Objetivo"
              valor={formatearDuracion(plan.duracionObjetivo)}
              color="var(--color-plan)"
            />
            <FilaValor
              etiqueta={analisisHoy.diferencia >= 0 ? "Sobró" : "Faltó"}
              valor={formatearDuracion(Math.abs(analisisHoy.diferencia))}
              color={analisisHoy.diferencia >= 0 ? "var(--color-recuperado)" : "var(--color-perdido)"}
            />
          </div>
        ) : null}

        {simulando ? <div style={{ marginTop: 20 }}><Simulador plan={plan} /></div> : null}
      </Tarjeta>

      <Tarjeta titulo="La noche, de punta a punta">
        <CintaNoche plan={plan} analisis={analisisHoy} ahoraEje={eje} />
      </Tarjeta>

      <Tarjeta titulo="La cuenta">
        <div className="rejilla rejilla-2" style={{ alignItems: "start" }}>
          <div>
            {retraso > 0 ? (
              <Aviso tono={analisisHoy.tocaFranjaCritica ? "mal" : "medio"}>
                {acostado ? "Te acostaste" : "Vas"} {formatearDuracion(retraso)}{" "}
                {acostado ? "después" : "pasado"} de tu hora.
                {acostado ? (
                  <>
                    {" "}
                    Mañana te levantás a las {formatearHora(previsto)} y{" "}
                    {Math.round(analisisHoy.costeTrasnocho * 0.8)} puntos menos de energía.
                  </>
                ) : (
                  <>
                    {" "}
                    Si te acostás ahora, te levantás a las {formatearHora(previsto)}.
                  </>
                )}
              </Aviso>
            ) : (
              <Aviso tono="ok">
                {acostado
                  ? `Te acostaste en hora. Mañana te levantás a las ${formatearHora(previsto)}.`
                  : "Vas en hora. Todavía estás a tiempo."}
              </Aviso>
            )}

            {analisisHoy.tocaFranjaCritica ? (
              <Aviso tono="mal">
                <strong>Ojo:</strong> parte de ese retraso cae entre las{" "}
                {formatearHora(FRANJA_CRITICA.desde)} y las {formatearHora(FRANJA_CRITICA.hasta)},
                la franja donde el cuerpo vigila menos. Ahí despertar sale del sueño profundo y
                cuesta casi el doble.
              </Aviso>
            ) : null}
          </div>

          <div>
            <FilaValor
              etiqueta="Deuda acumulada"
              valor={formatearDuracion(Math.abs(deudaMin))}
              color={deudaMin > 0 ? "var(--color-perdido)" : "var(--color-recuperado)"}
            />
            <FilaValor
              etiqueta="En paz en"
              valor={
                nochesParaSanar === 0
                  ? "ya estás"
                  : nochesParaSanar === Infinity
                    ? "sin ritmo"
                    : `${nochesParaSanar} ${nochesParaSanar === 1 ? "noche" : "noches"}`
              }
              color="var(--color-querido)"
            />
            <FilaValor
              etiqueta="Próximo aviso"
              valor={ciclo.proxima ? `${ciclo.proxima.falta}` : "—"}
              color="var(--color-plan)"
            />
            <div style={{ marginTop: 14 }}>
              <Pastilla color={ciclo.proxima ? "var(--color-plan)" : "#5b6480"}>
                {ciclo.proxima
                  ? formatearHora(ciclo.proxima.enEje)
                  : "sin avisos"}
              </Pastilla>
            </div>
          </div>
        </div>
      </Tarjeta>

      {noche && (acostado || levantado) ? (
        <Tarjeta>
          <div className="acciones">
            <Boton chico fantasma onClick={() => acciones.acostarse(hoy, null)}>
              Quitar hora de acostarse
            </Boton>
            {levantado ? (
              <Boton chico fantasma onClick={() => acciones.levantarse(hoy, null)}>
                Quitar hora de levantarse
              </Boton>
            ) : null}
            <Boton chico fantasma onClick={() => acciones.borrarNoche(hoy)}>
              Borrar la noche entera
            </Boton>
          </div>
        </Tarjeta>
      ) : null}
    </>
  );
}

function FilaValor({ etiqueta, valor, color = "#e9edf8" }) {
  return (
    <div className="fila">
      <span style={{ fontSize: 14 }}>{etiqueta}</span>
      <span className="cifra" style={{ fontSize: 16, color }}>{valor}</span>
    </div>
  );
}
