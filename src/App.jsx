import { useState } from "react";
import { useSueno } from "./hooks/useSueno";
import PanelHoy from "./components/PanelHoy";
import PanelInventario from "./components/PanelInventario";
import PanelDeuda from "./components/PanelDeuda";
import PanelAjustes from "./components/PanelAjustes";
import { formatearDuracion } from "./lib/tiempo";

const PESTAÑAS = [
  { id: "hoy", label: "Hoy" },
  { id: "inventario", label: "Inventario" },
  { id: "deuda", label: "Deuda" },
  { id: "ajustes", label: "Ajustes" },
];

export default function App() {
  const sueno = useSueno();
  const [pestana, setPestana] = useState("hoy");

  const enDeuda = sueno.deudaMin > 0;

  return (
    <>
      <div className="estrellas" />
      <div className="app">
        <header className="cabecera">
          <div className="marca">
            <div className="logo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" fill="#cfc8ff" />
              </svg>
            </div>
            <div>
              <h1 className="titulo">La noche es un recurso</h1>
              <p className="subtitulo">
                Cada hora que seguís despierto no desaparece: la estás gastando de mañana.
              </p>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              className="mono"
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: enDeuda ? "var(--rosa)" : "var(--verde)",
              }}
            >
              {formatearDuracion(Math.abs(sueno.deudaMin))}
            </div>
            <div className="cifra-etiqueta">
              {enDeuda ? "de deuda acumulada" : "de margen acumulado"}
            </div>
          </div>
        </header>

        <nav className="tabs" style={{ marginBottom: 20 }}>
          {PESTAÑAS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="tab"
              data-activo={pestana === p.id}
              onClick={() => setPestana(p.id)}
            >
              {p.label}
            </button>
          ))}
        </nav>

        <main key={pestana} className="aparece">
          {pestana === "hoy" && <PanelHoy sueno={sueno} />}
          {pestana === "inventario" && <PanelInventario sueno={sueno} />}
          {pestana === "deuda" && <PanelDeuda sueno={sueno} />}
          {pestana === "ajustes" && <PanelAjustes sueno={sueno} />}
        </main>
      </div>
    </>
  );
}