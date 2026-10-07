export function Tarjeta({ titulo, bajada, children, className = "" }) {
  return (
    <section className={`tarjeta ${className}`}>
      {titulo ? <h2 className="tarjeta-titulo">{titulo}</h2> : null}
      {bajada ? <p className="tarjeta-bajada">{bajada}</p> : null}
      {children}
    </section>
  );
}

export function Cifra({ valor, nota, color = "", grande = false }) {
  return (
    <div>
      <div className={`cifra ${grande ? "cifra-xl" : ""} ${color}`}>{valor}</div>
      {nota ? <div className="cifra-nota">{nota}</div> : null}
    </div>
  );
}

export function Pastilla({ children, color = "#8b95b0" }) {
  return (
    <span className="pastilla" style={{ color }}>
      <span className="punto" />
      {children}
    </span>
  );
}

export function Aviso({ tono = "info", children }) {
  return <div className={`aviso aviso-${tono}`}>{children}</div>;
}

export function Fila({ children }) {
  return <div className="fila">{children}</div>;
}
