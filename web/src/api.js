// Todas las peticiones al servidor, con fetch (sin SDK de PocketBase).
const BASE = import.meta.env.VITE_PB_URL ?? "http://127.0.0.1:8090";

async function pedir(ruta, opciones = {}) {
  const res = await fetch(`${BASE}${ruta}`, opciones);
  if (res.status === 204) return null;

  let datos = null;
  try {
    datos = await res.json();
  } catch {
    // respuesta sin cuerpo JSON
  }

  if (!res.ok) {
    // PocketBase devuelve { message, data: { campo: { message } } }
    const detalle = datos?.data
      ? Object.entries(datos.data)
          .map(([campo, v]) => `${campo}: ${v.message}`)
          .join("; ")
      : "";
    const mensaje = [datos?.message, detalle].filter(Boolean).join(" ");
    throw new Error(mensaje || `Error ${res.status}`);
  }
  return datos;
}

const enJson = (metodo, cuerpo) => ({
  method: metodo,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(cuerpo),
});

export const urlFoto = (orden, archivo) =>
  `${BASE}/api/files/ordenes/${orden.id}/${archivo}`;

// ---- clientes ----
export const listarClientes = (signal) =>
  pedir("/api/collections/clientes/records?perPage=500&sort=nombre", { signal }).then(
    (d) => d.items
  );

export const crearCliente = (cliente) =>
  pedir("/api/collections/clientes/records", enJson("POST", cliente));

// ---- ordenes ----
export const listarOrdenes = (signal) =>
  pedir("/api/collections/ordenes/records?perPage=500&sort=-created&expand=cliente", {
    signal,
  }).then((d) => d.items);

export const obtenerOrden = (id, signal) =>
  pedir(`/api/collections/ordenes/records/${id}?expand=cliente`, { signal });

// formData incluye las fotos
export const crearOrden = (formData) =>
  pedir("/api/collections/ordenes/records", { method: "POST", body: formData });

// Cambia la etapa. "extra" lleva el presupuesto cuando se pasa a presupuestada.
export const cambiarEstado = (id, estado, extra = {}) =>
  pedir(`/api/collections/ordenes/records/${id}`, enJson("PATCH", { estado, ...extra }));

// ---- eventos (historial) ----
export const listarEventos = (ordenId, signal) => {
  const filtro = encodeURIComponent(`orden="${ordenId}"`);
  return pedir(
    `/api/collections/eventos/records?perPage=200&sort=created&filter=${filtro}`,
    { signal }
  ).then((d) => d.items);
};
