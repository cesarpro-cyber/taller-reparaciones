import { useRef, useState } from "react";
import { cambiarEstado } from "../api.js";
import { calcularTotal, dinero } from "../util.js";

// Formulario controlado: cada campo vive en el estado de React.
export default function FormPresupuesto({ orden, onCambio }) {
  const [diagnostico, setDiagnostico] = useState("");
  const [manoObra, setManoObra] = useState("0");
  const [piezas, setPiezas] = useState([]);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  // useRef: contador que sobrevive a los renders sin provocar uno nuevo.
  // Da una key estable a cada fila de pieza (el índice fallaría al borrar filas).
  const contador = useRef(0);

  function agregarPieza() {
    contador.current += 1;
    setPiezas([
      ...piezas,
      { clave: contador.current, descripcion: "", cantidad: "1", precio: "0" },
    ]);
  }

  function cambiarPieza(clave, campo, valor) {
    setPiezas(piezas.map((p) => (p.clave === clave ? { ...p, [campo]: valor } : p)));
  }

  function quitarPieza(clave) {
    setPiezas(piezas.filter((p) => p.clave !== clave));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError("");
    setOcupado(true);
    try {
      await cambiarEstado(orden.id, "presupuestada", {
        diagnostico: diagnostico.trim(),
        manoObra: Number(manoObra),
        piezas: piezas.map((p) => ({
          descripcion: p.descripcion.trim(),
          cantidad: Number(p.cantidad),
          precio: Number(p.precio),
        })),
      });
      await onCambio();
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  const total = calcularTotal(manoObra, piezas);

  return (
    <form className="panel" onSubmit={enviar}>
      <h2>Registrar diagnóstico y presupuesto</h2>

      <label>
        Diagnóstico
        <textarea
          value={diagnostico}
          onChange={(e) => setDiagnostico(e.target.value)}
          rows="3"
          required
        />
      </label>

      <label>
        Mano de obra
        <input
          type="number"
          min="0"
          step="0.01"
          value={manoObra}
          onChange={(e) => setManoObra(e.target.value)}
          required
        />
      </label>

      <fieldset>
        <legend>Piezas</legend>
        {piezas.length === 0 && <p className="nota">Sin piezas. Añade las que necesite.</p>}
        {piezas.map((p) => (
          <div className="fila-pieza" key={p.clave}>
            <input
              placeholder="Descripción"
              value={p.descripcion}
              onChange={(e) => cambiarPieza(p.clave, "descripcion", e.target.value)}
              required
            />
            <input
              type="number"
              min="1"
              step="1"
              aria-label="Cantidad"
              value={p.cantidad}
              onChange={(e) => cambiarPieza(p.clave, "cantidad", e.target.value)}
              required
            />
            <input
              type="number"
              min="0"
              step="0.01"
              aria-label="Precio"
              value={p.precio}
              onChange={(e) => cambiarPieza(p.clave, "precio", e.target.value)}
              required
            />
            <button type="button" className="secundario" onClick={() => quitarPieza(p.clave)}>
              Quitar
            </button>
          </div>
        ))}
        <button type="button" className="secundario" onClick={agregarPieza}>
          Añadir pieza
        </button>
      </fieldset>

      <p className="total">Total del presupuesto: {dinero(total)}</p>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={ocupado}>
        Guardar presupuesto
      </button>
    </form>
  );
}
