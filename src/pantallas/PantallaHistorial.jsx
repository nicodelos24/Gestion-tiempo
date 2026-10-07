import { useMemo, useState } from "react";
import { Tarjeta, Cifra, Aviso } from "../ui/Tarjeta.jsx";
import { Boton, Botones } from "../ui/Boton.jsx";
import {
  formatearHora,
  formatearDuracion,
  etiquetaDia,
  sumarDias,
  duracionCompacta,
} from "../nucleo/reloj.js";

const DIAS = 14;

export function PantallaHistorial({ sueno }) {
  const { historial, hoy, acciones, deudaMin, nochesParaSanar } = sueno;
  const [editando, setEditando] = useState(null);

  const ventana = useMemo(() => {
    const porFecha = new Map(historial.map((n) => [n.fecha, n]));
    return Array.from({ length: DIAS }, (_, i) => {
      const fecha = sumarDias(hoy, -(DIAS - 1 - i));
      return porFecha.get(fecha) ?? { fecha, acostarse: null, levantarse: null, durmido: null, delta: 0, futuro: true };
    });
  }, [historial, hoy]);

  const maximo = Math.max(120, ...ventana.map((d) => Math.abs(d.delta ?? 0)));
  const completas = historial.filter((n) => n.completa);
  const promedio = completas.length
    ? Math.round((completas.reduce((s, n) => s + n.durmido, 0) / completas.length / 60) * 10) / 10
    : null;

  return (
    <>
      <Tarjeta
        titulo="Últimos 14 días"
        bajada={
          deudaMin > 0
            ? `Tenés ${formatearDuracion(deudaMin)} de deuda. Dormir de más la descuenta 1,5 veces más rápido de lo que la acumula trasnochar.`
            : "Sin deuda. Lo que te adelantes ahora es margen para las noches difíciles."
        }
      >
        <div className="rejilla rejilla-3" style={{ marginBottom: 18 }}>
          <Cifra
            valor={formatearDuracion(Math.abs(deudaMin))}
            nota="deuda acumulada"
            color={deudaMin > 0 ? "var(--color-perdido)" : "var(--color-recuperado)"}
          />
          <Cifra
            valor={
              nochesParaSanar === 0
                ? "listo"
                : nochesParaSanar === Infinity
                  ? "—"
                  : `${nochesParaSanar}`
            }
            nota="noches para estar en paz"
            color="var(--color-querido)"
          />
          <Cifra
            valor={promedio != null ? `${promedio} h` : "—"}
            nota="sueño promedio"
            color="var(--color-plan)"
          />
        </div>

        <div className="barras">
          {ventana.map((dia) => {
            const valor = dia.delta ?? 0;
            const altura = dia.futuro ? 3 : Math.max(7, (Math.abs(valor) / maximo) * 100);
            const color = dia.futuro
              ? "rgba(255,255,255,0.07)"
              : valor > 0
                ? "var(--color-perdido)"
                : valor < 0
                  ? "var(--color-recuperado)"
                  : "var(--color-querido)";
            return (
              <div className="barra-col" key={dia.fecha}>
                <span className="barra-txt">{dia.futuro ? "" : duracionCompacta(valor)}</span>
                <div
                  className="barra"
                  style={{ height: `${altura}%`, background: color, opacity: dia.futuro ? 0.4 : 1 }}
                  title={`${etiquetaDia(dia.fecha)}: ${dia.futuro ? "sin datos" : formatearDuracion(valor)}`}
                />
                <span className="barra-txt">{etiquetaDia(dia.fecha).slice(0, 3)}</span>
              </div>
            );
          })}
        </div>

        <div className="nota" style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 16 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--color-perdido)" }} />
            Falte sueño
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--color-recuperado)" }} />
            Sobró sueño
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(255,255,255,0.2)" }} />
            Sin datos
          </span>
        </div>
      </Tarjeta>

      <Tarjeta
        titulo="Registro"
        bajada="Cargá las noches que quieras a mano. Sólo necesitás la hora de acostarte; la de levantarte sirve para cerrar el balance."
      >
        <div className="rejilla rejilla-4" style={{ marginBottom: 16 }}>
          {historial
            .slice(-8)
            .reverse()
            .map((noche) => (
              <FilaNoche
                key={noche.fecha}
                noche={noche}
                onEditar={() => setEditando(editando === noche.fecha ? null : noche.fecha)}
                onBorrar={() => acciones.borrarNoche(noche.fecha)}
              />
            ))}
        </div>

        {historial.length === 0 ? (
          <Aviso tono="info">
            Todavía no hay noches registradas. Anotá una desde la pantalla de Hoy o esperá al
            aviso de la mañana.
          </Aviso>
        ) : null}

        {editando ? (
          <EditorNoche
            noche={historial.find((n) => n.fecha === editando)}
            fecha={editando}
            alGuardar={(cambios) => {
              acciones.marcar(editando, cambios);
              setEditando(null);
            }}
            alCancelar={() => setEditando(null)}
          />
        ) : null}
      </Tarjeta>
    </>
  );
}

function FilaNoche({ noche, onEditar, onBorrar }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 15,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.025)",
      }}
    >
      <div style={{ fontSize: 12.5, color: "#8b95b0", marginBottom: 6 }}>{etiquetaDia(noche.fecha)}</div>
      <div className="cifra" style={{ fontSize: 17 }}>
        {formatearHora(noche.acostarse)}
        <span className="c-tenue"> → </span>
        {noche.levantarse != null ? formatearHora(noche.levantarse) : "?"}
      </div>
      <div className="cifra-nota">
        {noche.durmido != null ? formatearDuracion(noche.durmido) : "sin confirmar"}
      </div>
      <div style={{ marginTop: 10 }}>
        <Botones>
          <Boton chico fantasma onClick={onEditar}>
            Editar
          </Boton>
          <Boton chico fantasma onClick={onBorrar}>
            Borrar
          </Boton>
        </Botones>
      </div>
    </div>
  );
}

function EditorNoche({ noche, fecha, alGuardar, alCancelar }) {
  const [acostarse, setAcostarse] = useState(noche?.acostarse ?? 330);
  const [levantarse, setLevantarse] = useState(noche?.levantarse ?? 810);

  return (
    <div style={{ marginTop: 18, padding: 18, borderRadius: 16, background: "rgba(124,108,255,0.07)", border: "1px solid rgba(124,108,255,0.24)" }}>
      <div className="cifra" style={{ fontSize: 15, marginBottom: 14 }}>
        {etiquetaDia(fecha)}
      </div>
      <EditorCampo etiqueta="Me acosté" valor={acostarse} alCambiar={setAcostarse} />
      <EditorCampo etiqueta="Me levanté" valor={levantarse} alCambiar={setLevantarse} />
      <Botones>
        <Boton variante="principal" chico onClick={() => alGuardar({ acostarse, levantarse })}>
          Guardar
        </Boton>
        <Boton fantasma chico onClick={alCancelar}>
          Cancelar
        </Boton>
      </Botones>
    </div>
  );
}

function EditorCampo({ etiqueta, valor, alCambiar }) {
  return (
    <label className="fila" style={{ cursor: "text" }}>
      <span style={{ fontSize: 14 }}>{etiqueta}</span>
      <input
        className="campo-hora"
        type="time"
        value={formatearHora(valor)}
        onChange={(e) => {
          const [h, m] = e.target.value.split(":").map(Number);
          if (!Number.isNaN(h)) alCambiar(((h * 60 + m - 1080 + 1440) % 1440));
        }}
      />
    </label>
  );
}
