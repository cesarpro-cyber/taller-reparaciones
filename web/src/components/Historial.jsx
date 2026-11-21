import { ETIQUETAS } from "../estados.js";
import { fecha } from "../util.js";

export default function Historial({ eventos }) {
  return (
    <section className="panel">
      <h2>Historial</h2>
      {eventos.length === 0 ? (
        <p className="nota">Todavía no hay cambios de etapa.</p>
      ) : (
        <ul className="historial">
          {eventos.map((ev) => (
            <li key={ev.id}>
              <span className="fecha">{fecha(ev.created)}</span>
              <span>
                {ETIQUETAS[ev.de] ?? ev.de} → {ETIQUETAS[ev.a] ?? ev.a}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
