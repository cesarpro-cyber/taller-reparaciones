import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { listarEventos, obtenerOrden, urlFoto } from "../api.js";
import EstadoBadge from "../components/EstadoBadge.jsx";
import Progreso from "../components/Progreso.jsx";
import Presupuesto from "../components/Presupuesto.jsx";
import Historial from "../components/Historial.jsx";
import Acciones from "../components/Acciones.jsx";

export default function DetalleOrden() {
  const { id } = useParams(); // parámetro de ruta
  const [orden, setOrden] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [error, setError] = useState("");

  // useCallback: "recargar" es dependencia del useEffect Y se pasa como prop a <Acciones>.
  // Sin useCallback se crearía una función nueva en cada render, el efecto se volvería a
  // ejecutar en cada render y pediría datos al servidor en bucle. Con [id] solo cambia
  // cuando cambia la orden que se está viendo.
  const recargar = useCallback(
    async (signal) => {
      try {
        const [o, ev] = await Promise.all([
          obtenerOrden(id, signal),
          listarEventos(id, signal),
        ]);
        setOrden(o);
        setEventos(ev);
        setError("");
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message);
      }
    },
    [id]
  );

  useEffect(() => {
    const control = new AbortController();
    setOrden(null);
    setEventos([]);
    recargar(control.signal);
    return () => control.abort(); // limpieza: cancela si se cambia de orden o se sale
  }, [recargar]);

  if (error) {
    return (
      <>
        <p className="error">No se pudo cargar la orden: {error}</p>
        <Link to="/ordenes">Volver a las órdenes</Link>
      </>
    );
  }
  if (!orden) return <p>Cargando…</p>;

  const cliente = orden.expand?.cliente;
  const tienePresupuesto = orden.diagnostico !== "";

  return (
    <>
      <p>
        <Link to="/ordenes">← Órdenes</Link>
      </p>
      <div className="encabezado">
        <h2>{orden.equipo}</h2>
        <EstadoBadge estado={orden.estado} />
      </div>

      <Progreso estado={orden.estado} />

      <section className="panel">
        <h2>Datos</h2>
        <p>
          <strong>Cliente:</strong> {cliente?.nombre ?? "—"}
          {cliente?.telefono && ` · ${cliente.telefono}`}
        </p>
        <p>
          <strong>Problema:</strong> {orden.problema}
        </p>
        {orden.fotos?.length > 0 && (
          <div className="fotos">
            {orden.fotos.map((archivo) => (
              <a key={archivo} href={urlFoto(orden, archivo)} target="_blank" rel="noreferrer">
                <img src={urlFoto(orden, archivo)} alt={`Foto de ${orden.equipo}`} />
              </a>
            ))}
          </div>
        )}
      </section>

      {tienePresupuesto && <Presupuesto orden={orden} />}

      <Acciones orden={orden} onCambio={recargar} />

      <Historial eventos={eventos} />
    </>
  );
}
