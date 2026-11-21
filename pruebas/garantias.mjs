// Prueba las garantías del servidor hablando DIRECTAMENTE con la API (sin la interfaz).
// Uso (con PocketBase corriendo):   node pruebas/garantias.mjs
// Crea 3 órdenes de prueba nuevas. Necesita Node 18 o superior (fetch incluido).

const BASE = process.env.PB_URL ?? "http://127.0.0.1:8090";
let fallos = 0;

async function api(metodo, ruta, cuerpo) {
  const res = await fetch(`${BASE}/api/collections${ruta}`, {
    method: metodo,
    headers: cuerpo ? { "Content-Type": "application/json" } : {},
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  let datos = null;
  try {
    datos = await res.json();
  } catch {
    // sin cuerpo
  }
  return { ok: res.ok, status: res.status, datos };
}

function verificar(nombre, condicion, detalle = "") {
  console.log(`${condicion ? "OK   " : "FALLA"} ${nombre}${!condicion && detalle ? `  -> ${detalle}` : ""}`);
  if (!condicion) fallos++;
}
const detalle = (r) => `HTTP ${r.status} ${r.datos?.message ?? ""}`;
const patch = (id, cuerpo) => api("PATCH", `/ordenes/records/${id}`, cuerpo);
const debeRechazar = (nombre, r) => verificar(nombre, !r.ok && r.status >= 400, detalle(r));
const debeAceptar = (nombre, r) => verificar(nombre, r.ok, detalle(r));

// ---- preparación ----
const clientes = await api("GET", "/clientes/records?perPage=1");
const cliente = clientes.datos?.items?.[0]?.id;
if (!cliente) {
  console.error("No hay clientes. ¿Está PocketBase corriendo y con las migraciones aplicadas?");
  process.exit(1);
}
const base = { cliente, equipo: "Equipo de prueba", problema: "Prueba automática" };

async function nuevaOrden() {
  const r = await api("POST", "/ordenes/records", { ...base, estado: "solicitada" });
  if (!r.ok) throw new Error(`No se pudo crear la orden de prueba: ${detalle(r)}`);
  return r.datos.id;
}

console.log("\n== Creación ==");
debeRechazar("No se puede crear una orden directamente en 'lista'",
  await api("POST", "/ordenes/records", { ...base, estado: "lista" }));
debeRechazar("No se puede crear una orden con presupuesto",
  await api("POST", "/ordenes/records", { ...base, estado: "solicitada", diagnostico: "x", manoObra: 10 }));

console.log("\n== Orden del proceso ==");
const o1 = await nuevaOrden();
debeRechazar("solicitada -> lista (salto de etapas)", await patch(o1, { estado: "lista" }));
debeRechazar("solicitada -> entregada (salto de etapas)", await patch(o1, { estado: "entregada" }));
debeRechazar("solicitada -> aprobada (salto de etapas)", await patch(o1, { estado: "aprobada" }));
debeRechazar("Editar el equipo sin cambiar de etapa", await patch(o1, { equipo: "Otro" }));
debeAceptar("solicitada -> en_diagnostico", await patch(o1, { estado: "en_diagnostico" }));
debeRechazar("en_diagnostico -> cancelada (solo se cancela en 'solicitada')", await patch(o1, { estado: "cancelada" }));
debeRechazar("en_diagnostico -> aprobada", await patch(o1, { estado: "aprobada" }));
debeRechazar("Presupuesto sin diagnóstico",
  await patch(o1, { estado: "presupuestada", diagnostico: "", manoObra: 10, piezas: [] }));
debeRechazar("Presupuesto con pieza de cantidad 0",
  await patch(o1, { estado: "presupuestada", diagnostico: "ok", manoObra: 10,
    piezas: [{ descripcion: "Pieza", cantidad: 0, precio: 5 }] }));
debeRechazar("Presupuesto con mano de obra negativa",
  await patch(o1, { estado: "presupuestada", diagnostico: "ok", manoObra: -5, piezas: [] }));
debeAceptar("en_diagnostico -> presupuestada (con presupuesto válido)",
  await patch(o1, {
    estado: "presupuestada", diagnostico: "Falla de la fuente", manoObra: 40,
    piezas: [{ descripcion: "Fuente 12V", cantidad: 2, precio: 15 }],
  }));

console.log("\n== Presupuesto inmutable ==");
debeRechazar("Cambiar manoObra estando presupuestada", await patch(o1, { manoObra: 1 }));
debeRechazar("Cambiar manoObra a la vez que se aprueba", await patch(o1, { estado: "aprobada", manoObra: 1 }));
debeRechazar("Cambiar piezas a la vez que se aprueba",
  await patch(o1, { estado: "aprobada", piezas: [{ descripcion: "X", cantidad: 1, precio: 1 }] }));
debeAceptar("presupuestada -> aprobada", await patch(o1, { estado: "aprobada" }));
debeRechazar("Cambiar el diagnóstico estando aprobada", await patch(o1, { estado: "en_reparacion", diagnostico: "otro" }));
debeAceptar("aprobada -> en_reparacion", await patch(o1, { estado: "en_reparacion" }));
debeAceptar("en_reparacion -> lista", await patch(o1, { estado: "lista" }));
debeAceptar("lista -> entregada", await patch(o1, { estado: "entregada" }));
debeRechazar("Una orden entregada no cambia más", await patch(o1, { estado: "lista" }));
debeRechazar("Una orden entregada no admite ediciones", await patch(o1, { equipo: "Otro" }));

console.log("\n== Rechazo y cancelación ==");
const o2 = await nuevaOrden();
await patch(o2, { estado: "en_diagnostico" });
await patch(o2, { estado: "presupuestada", diagnostico: "Pantalla rota", manoObra: 50, piezas: [] });
debeAceptar("presupuestada -> rechazada", await patch(o2, { estado: "rechazada" }));
debeRechazar("Una orden rechazada no cambia más", await patch(o2, { estado: "aprobada" }));

const o3 = await nuevaOrden();
debeAceptar("solicitada -> cancelada", await patch(o3, { estado: "cancelada" }));
debeRechazar("Una orden cancelada no cambia más", await patch(o3, { estado: "en_diagnostico" }));

console.log("\n== Borrados ==");
debeRechazar("No se puede borrar una orden", await api("DELETE", `/ordenes/records/${o1}`));
debeRechazar("No se puede borrar un cliente", await api("DELETE", `/clientes/records/${cliente}`));

console.log("\n== Historial ==");
const lista = await api("GET", `/eventos/records?perPage=50&sort=created&filter=${encodeURIComponent(`orden="${o1}"`)}`);
const eventos = lista.datos?.items ?? [];
const recorrido = eventos.map((e) => `${e.de}>${e.a}`).join(" | ");
verificar("La orden completa tiene 6 eventos", eventos.length === 6, `hay ${eventos.length}: ${recorrido}`);
verificar("Los eventos siguen el orden del proceso",
  recorrido === "solicitada>en_diagnostico | en_diagnostico>presupuestada | presupuestada>aprobada | aprobada>en_reparacion | en_reparacion>lista | lista>entregada",
  recorrido);
verificar("Cada evento tiene fecha", eventos.every((e) => Boolean(e.created)));
const eventoId = eventos[0]?.id;
debeRechazar("No se pueden crear eventos por la API",
  await api("POST", "/eventos/records", { orden: o1, de: "solicitada", a: "entregada" }));
if (eventoId) {
  debeRechazar("No se puede editar un evento", await api("PATCH", `/eventos/records/${eventoId}`, { a: "lista" }));
  debeRechazar("No se puede borrar un evento", await api("DELETE", `/eventos/records/${eventoId}`));
}
const o2eventos = await api("GET", `/eventos/records?filter=${encodeURIComponent(`orden="${o2}"`)}`);
verificar("Los rechazos fallidos no dejan eventos de más (orden rechazada: 3 eventos)",
  o2eventos.datos?.items?.length === 3, `hay ${o2eventos.datos?.items?.length}`);

console.log(fallos === 0 ? "\nTodo en orden." : `\n${fallos} prueba(s) fallaron.`);
process.exit(fallos === 0 ? 0 : 1);
