import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { crearCliente, crearOrden, listarClientes } from "../api.js";

export default function NuevaOrden() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [modo, setModo] = useState("existente"); // "existente" | "nuevo"
  const [clienteId, setClienteId] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [equipo, setEquipo] = useState("");
  const [problema, setProblema] = useState("");
  const [fotos, setFotos] = useState([]);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  // useRef: acceso directo al <input type="file"> para poder vaciarlo
  // (un input de archivos no se puede controlar con value).
  const inputFotos = useRef(null);

  useEffect(() => {
    const control = new AbortController();
    listarClientes(control.signal)
      .then((lista) => {
        setClientes(lista);
        if (lista.length === 0) setModo("nuevo");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => control.abort();
  }, []);

  function elegirFotos(evento) {
    const elegidas = Array.from(evento.target.files);
    if (elegidas.length > 3) {
      setError("Máximo 3 fotos.");
      evento.target.value = "";
      setFotos([]);
      return;
    }
    setError("");
    setFotos(elegidas);
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError("");
    if (modo === "existente" && !clienteId) {
      setError("Elige un cliente o registra uno nuevo.");
      return;
    }

    setOcupado(true);
    let creado = null;
    try {
      let idCliente = clienteId;
      if (modo === "nuevo") {
        creado = await crearCliente({ nombre: nombre.trim(), telefono: telefono.trim() });
        idCliente = creado.id;
      }

      const datos = new FormData();
      datos.append("cliente", idCliente);
      datos.append("equipo", equipo.trim());
      datos.append("problema", problema.trim());
      datos.append("estado", "solicitada");
      fotos.forEach((f) => datos.append("fotos", f));

      const orden = await crearOrden(datos);
      navigate(`/ordenes/${orden.id}`);
    } catch (e) {
      setError(e.message);
      // Si el cliente se creó pero la orden falló, al reintentar se usa ese cliente
      // para no duplicarlo.
      if (creado) {
        setClientes((prev) => [...prev, creado]);
        setClienteId(creado.id);
        setModo("existente");
      }
      setOcupado(false);
    }
  }

  return (
    <>
      <h2>Registrar equipo</h2>
      <form className="panel" onSubmit={enviar}>
        <fieldset>
          <legend>Cliente</legend>
          <div className="opciones">
            <label className="en-linea">
              <input
                type="radio"
                name="modo"
                checked={modo === "existente"}
                onChange={() => setModo("existente")}
                disabled={clientes.length === 0}
              />
              Cliente registrado
            </label>
            <label className="en-linea">
              <input
                type="radio"
                name="modo"
                checked={modo === "nuevo"}
                onChange={() => setModo("nuevo")}
              />
              Cliente nuevo
            </label>
          </div>

          {modo === "existente" ? (
            <label>
              Cliente
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Elige un cliente…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.telefono && `(${c.telefono})`}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label>
                Nombre
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              </label>
              <label>
                Teléfono
                <input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </label>
            </>
          )}
        </fieldset>

        <label>
          Equipo
          <input
            value={equipo}
            onChange={(e) => setEquipo(e.target.value)}
            placeholder="Ej.: Laptop HP Pavilion 15"
            required
          />
        </label>

        <label>
          Problema
          <textarea
            value={problema}
            onChange={(e) => setProblema(e.target.value)}
            rows="4"
            required
          />
        </label>

        <label>
          Fotos (hasta 3)
          <input
            ref={inputFotos}
            type="file"
            accept="image/*"
            multiple
            onChange={elegirFotos}
          />
        </label>

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={ocupado}>
          Registrar equipo
        </button>
      </form>
    </>
  );
}
