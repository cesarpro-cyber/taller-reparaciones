import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { listarOrdenes } from "../api.js";
import { TODOS, ETIQUETAS } from "../estados.js";
import { fecha } from "../util.js";
import EstadoBadge from "../components/EstadoBadge.jsx";

export default function ListaOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  // El filtro vive en la URL (?estado=lista), así se puede enlazar desde el resumen
  const [params, setParams] = useSearchParams();
  const filtro = params.get("estado") ?? "";

  useEffect(() => {
    const control = new AbortController();
    listarOrdenes(control.signal)
      .then(setOrdenes)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!control.signal.aborted) setCargando(false);
      });
    return () => control.abort();
  }, []);

  function cambiarFiltro(valor) {
    setParams(valor ? { estado: valor } : {});
  }

  const visibles = filtro ? ordenes.filter((o) => o.estado === filtro) : ordenes;

  return (
    <>
      <h2>Órdenes</h2>
      <label className="filtro">
        Etapa
        <select value={filtro} onChange={(e) => cambiarFiltro(e.target.value)}>
          <option value="">Todas</option>
          {TODOS.map((estado) => (
            <option key={estado} value={estado}>
              {ETIQUETAS[estado]}
            </option>
          ))}
        </select>
      </label>

      {cargando && <p>Cargando…</p>}
      {error && <p className="error">No se pudieron cargar las órdenes: {error}</p>}
      {!cargando && !error && visibles.length === 0 && (
        <p className="nota">
          No hay órdenes en esta etapa. <Link to="/ordenes/nueva">Registrar un equipo</Link>
        </p>
      )}

      {visibles.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Equipo</th>
              <th>Cliente</th>
              <th>Etapa</th>
              <th>Registrada</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link to={`/ordenes/${o.id}`}>{o.equipo}</Link>
                </td>
                <td>{o.expand?.cliente?.nombre ?? "—"}</td>
                <td>
                  <EstadoBadge estado={o.estado} />
                </td>
                <td>{fecha(o.created)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
