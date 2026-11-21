// Las piezas llegan como lista, o vacías/nulas si la orden aún no tiene presupuesto.
export const listaPiezas = (orden) => (Array.isArray(orden.piezas) ? orden.piezas : []);

// El total NO se guarda: se calcula siempre (mano de obra + cantidad * precio de cada pieza).
export function calcularTotal(manoObra, piezas) {
  const piezasTotal = piezas.reduce(
    (suma, p) => suma + Number(p.cantidad || 0) * Number(p.precio || 0),
    0
  );
  return Number(manoObra || 0) + piezasTotal;
}

export const dinero = (n) =>
  Number(n).toLocaleString("es", { style: "currency", currency: "USD" });

export function fecha(texto) {
  // PocketBase entrega "2026-11-20 14:03:11.123Z"
  const f = new Date(texto.replace(" ", "T"));
  return f.toLocaleString("es", { dateStyle: "medium", timeStyle: "short" });
}
