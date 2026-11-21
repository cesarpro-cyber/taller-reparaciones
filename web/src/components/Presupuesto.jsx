import { calcularTotal, dinero, listaPiezas } from "../util.js";

export default function Presupuesto({ orden }) {
  const piezas = listaPiezas(orden);
  return (
    <section className="panel">
      <h2>Presupuesto</h2>
      <p>
        <strong>Diagnóstico:</strong> {orden.diagnostico}
      </p>
      <table>
        <thead>
          <tr>
            <th>Concepto</th>
            <th className="num">Cantidad</th>
            <th className="num">Precio</th>
            <th className="num">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Mano de obra</td>
            <td className="num">1</td>
            <td className="num">{dinero(orden.manoObra)}</td>
            <td className="num">{dinero(orden.manoObra)}</td>
          </tr>
          {piezas.map((p, i) => (
            <tr key={`${p.descripcion}-${i}`}>
              <td>{p.descripcion}</td>
              <td className="num">{p.cantidad}</td>
              <td className="num">{dinero(p.precio)}</td>
              <td className="num">{dinero(p.cantidad * p.precio)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan="3">Total</th>
            <th className="num">{dinero(calcularTotal(orden.manoObra, piezas))}</th>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
