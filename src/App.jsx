import { useState } from "react";
import { useSueno } from "./hooks/useSueno.js";
import { useCicloNoche } from "./hooks/useCicloNoche.js";
import { PantallaHoy } from "./pantallas/PantallaHoy.jsx";
import { PantallaPlan } from "./pantallas/PantallaPlan.jsx";
import { PantallaHistorial } from "./pantallas/PantallaHistorial.jsx";
import { formatearDuracion } from "./nucleo/reloj.js";

const PESTANAS = [
  { id: "hoy", texto: "Hoy" },
  { id: "plan", texto: "Plan" },
  { id: "historial", texto: "Historial" },
];

export default function App() {
  const sueno = useSueno();
  const ciclo = useCicloNoche(sueno);
  const [pantalla, setPantana] = useState("hoy");

  const faltaPermiso = ciclo.permiso !== "granted";
  const enDeuda = sueno.deudaMin > 0;

  return (
    <>
      <div className="escenario" />
      <div className="app">
        <header className="marco">
          <div className="marca">
            <div className="logo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" fill="#cfc8ff" />
              </svg>
            </div>
            <div>
              <h1 className="titulo">La noche es un recurso</h1>
              <p className="subtitulo">
                Cada hora que seguís despierto a la noche es una hora que estás sacando de tu mañana.
              </p>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              className="cifra"
              style={{ fontSize: 24, color: enDeuda ? "var(--color-perdido)" : "var(--color-recuperado)" }}
            >
              {formatearDuracion(Math.abs(sueno.deudaMin))}
            </div>
            <div className="cifra-nota">{enDeuda ? "de deuda" : "de margen"}</div>
          </div>
        </header>

        <nav className="nav" aria-label="Secciones">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              className="nav-item"
              aria-current={pantalla === p.id ? "page" : undefined}
              data-alerta={p.id === "plan" && faltaPermiso ? "true" : undefined}
              onClick={() => setPantana(p.id)}
            >
              {p.texto}
            </button>
          ))}
        </nav>

        <main key={pantalla} className="aparece">
          {pantalla === "hoy" && <PantallaHoy sueno={sueno} ciclo={ciclo} />}
          {pantalla === "plan" && <PantallaPlan sueno={sueno} ciclo={ciclo} />}
          {pantalla === "historial" && <PantallaHistorial sueno={sueno} />}
        </main>
      </div>
    </>
  );
}
