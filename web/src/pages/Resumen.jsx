import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listarOrdenes } from "../api.js";
import { TODOS, ETIQUETAS } from "../estados.js";

export default function Resumen() {
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Sincroniza con el exterior (el servidor). La limpieza cancela la petición
  // si el componente se desmonta antes de que llegue la respuesta.
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

  if (cargando) return <p>Cargando…</p>;
  if (error) return <p className="error">No se pudo cargar el resumen: {error}</p>;

  const conteo = Object.fromEntries(TODOS.map((estado) => [estado, 0]));
  for (const o of ordenes) conteo[o.estado] += 1;
  const abiertas = ordenes.filter(
    (o) => !["entregada", "rechazada", "cancelada"].includes(o.estado)
  ).length;

  return (
    <>
      <h2>Resumen del trabajo</h2>
      <p>
        Hay <strong>{abiertas}</strong> órdenes en proceso de {ordenes.length} registradas.
      </p>
      <div className="cuadricula">
        {TODOS.map((estado) => (
          <Link key={estado} to={`/ordenes?estado=${estado}`} className={`tarjeta badge-${estado}`}>
            <span className="cifra">{conteo[estado]}</span>
            <span>{ETIQUETAS[estado]}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
