import { useState } from "react";
import { ACCIONES } from "../estados.js";
import { cambiarEstado } from "../api.js";
import FormPresupuesto from "./FormPresupuesto.jsx";

// Ofrece solo los cambios de etapa que la tabla permite desde la etapa actual.
// Es comodidad de la interfaz: quien realmente valida es el servidor (pb_hooks).
export default function Acciones({ orden, onCambio }) {
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  if (orden.estado === "en_diagnostico") {
    return <FormPresupuesto orden={orden} onCambio={onCambio} />;
  }

  const opciones = ACCIONES[orden.estado] ?? [];
  if (opciones.length === 0) {
    return (
      <section className="panel">
        <h2>Acciones</h2>
        <p className="nota">Esta orden está cerrada y ya no cambia.</p>
      </section>
    );
  }

  async function aplicar(opcion) {
    if (opcion.peligro && !window.confirm(`${opcion.texto}. ¿Confirmas?`)) return;
    setOcupado(true);
    setError("");
    try {
      await cambiarEstado(orden.id, opcion.estado);
      await onCambio(); // vuelve a pedir al servidor lo que quedó guardado
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="panel">
      <h2>Acciones</h2>
      <div className="botones">
        {opciones.map((op) => (
          <button
            key={op.estado}
            className={op.peligro ? "secundario peligro" : ""}
            disabled={ocupado}
            onClick={() => aplicar(op)}
          >
            {op.texto}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
