export function Boton({
  children,
  onClick,
  variante = "",
  chico = false,
  fantasma = false,
  deshabilitado = false,
  titulo,
  tipo = "button",
}) {
  const clases = ["boton"];
  if (variante === "principal") clases.push("boton-principal");
  if (chico) clases.push("boton-chico");
  if (fantasma) clases.push("boton-fantasma");

  return (
    <button
      type={tipo}
      className={clases.join(" ")}
      onClick={onClick}
      disabled={deshabilitado}
      title={titulo}
    >
      {children}
    </button>
  );
}

export function Botones({ children }) {
  return <div className="acciones">{children}</div>;
}
