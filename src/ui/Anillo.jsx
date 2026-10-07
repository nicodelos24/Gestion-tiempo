export function Anillo({ valor, maximo = 100, tamano = 140, grosor = 11, color, children }) {
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const proporcion = Math.max(0, Math.min(1, valor / maximo));

  return (
    <div style={{ position: "relative", width: tamano, height: tamano, flexShrink: 0 }}>
      <svg width={tamano} height={tamano} className="anillo" aria-hidden="true">
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
