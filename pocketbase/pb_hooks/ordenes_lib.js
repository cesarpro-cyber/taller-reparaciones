// Modulo compartido por los hooks de ordenes.
// Los handlers de PocketBase corren aislados: no ven variables definidas arriba
// en su propio archivo .pb.js, por eso lo comun vive aqui y se carga con require()
// DENTRO de cada handler.

// Unica fuente de verdad de las transiciones permitidas (y ninguna otra).
const TRANSICIONES = {
  solicitada: ["en_diagnostico", "cancelada"],
  en_diagnostico: ["presupuestada"],
  presupuestada: ["aprobada", "rechazada"],
  aprobada: ["en_reparacion"],
  en_reparacion: ["lista"],
  lista: ["entregada"],
  // estados finales: no cambian mas
  rechazada: [],
  cancelada: [],
  entregada: [],
};

// Lee el campo json "piezas" como objeto JS.
// Devuelve null si esta vacio, y undefined si el JSON es invalido.
function leerPiezas(record) {
  const crudo = record.getString("piezas");
  if (!crudo || crudo === "null") return null;
  try {
    return JSON.parse(crudo);
  } catch (_) {
    return undefined;
  }
}

// Devuelve un mensaje de error (string) o null si las piezas son validas.
function errorEnPiezas(piezas) {
  if (!Array.isArray(piezas)) {
    return "'piezas' debe ser una lista (puede estar vacía).";
  }
  for (let i = 0; i < piezas.length; i++) {
    const p = piezas[i];
    const n = i + 1;
    if (!p || typeof p !== "object") return `Pieza ${n}: formato inválido.`;
    if (typeof p.descripcion !== "string" || p.descripcion.trim() === "") {
      return `Pieza ${n}: la descripción es obligatoria.`;
    }
    if (typeof p.cantidad !== "number" || !Number.isFinite(p.cantidad) || p.cantidad <= 0) {
      return `Pieza ${n}: la cantidad debe ser un número mayor que 0.`;
    }
    if (typeof p.precio !== "number" || !Number.isFinite(p.precio) || p.precio < 0) {
      return `Pieza ${n}: el precio debe ser un número mayor o igual a 0.`;
    }
  }
  return null;
}

module.exports = { TRANSICIONES, leerPiezas, errorEnPiezas };
