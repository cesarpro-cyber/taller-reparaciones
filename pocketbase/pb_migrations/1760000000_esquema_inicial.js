/// <reference path="../pb_data/types.d.ts" />

// Esquema: clientes, ordenes y eventos (nombres exactos del enunciado).
//
// Reglas de acceso (no hay autenticacion, asi que no distinguen quien llama):
//   - "" (cadena vacia)  -> cualquiera puede hacer la operacion
//   - null               -> NADIE puede hacerla por la API (solo el servidor internamente)
// Lo que nunca debe ocurrir queda en null. El resto lo validan los hooks.
migrate((app) => {
  // ---------- clientes ----------
  const clientes = new Collection({
    type: "base",
    name: "clientes",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: null, // un cliente con historial no se borra
    fields: [
      { type: "text", name: "nombre", required: true, max: 120 },
      { type: "text", name: "telefono", max: 40 },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
    ],
  });
  app.save(clientes);

  // ---------- ordenes ----------
  const ordenes = new Collection({
    type: "base",
    name: "ordenes",
    listRule: "",
    viewRule: "",
    createRule: "", // el hook onRecordCreateRequest valida que nazca "solicitada"
    updateRule: "", // el hook onRecordUpdateRequest valida las transiciones
    deleteRule: null, // las ordenes nunca se borran
    fields: [
      {
        type: "relation",
        name: "cliente",
        required: true,
        collectionId: clientes.id,
        maxSelect: 1,
        cascadeDelete: false,
      },
      { type: "text", name: "equipo", required: true, max: 160 },
      { type: "text", name: "problema", required: true, max: 2000 },
      {
        type: "select",
        name: "estado",
        required: true,
        maxSelect: 1,
        values: [
          "solicitada",
          "en_diagnostico",
          "presupuestada",
          "aprobada",
          "rechazada",
          "en_reparacion",
          "lista",
          "entregada",
          "cancelada",
        ],
      },
      { type: "text", name: "diagnostico", max: 4000 },
      { type: "number", name: "manoObra", min: 0 },
      { type: "json", name: "piezas", maxSize: 1000000 },
      {
        type: "file",
        name: "fotos",
        maxSelect: 3,
        maxSize: 5242880, // 5 MB por foto
        mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
  });
  app.save(ordenes);

  // ---------- eventos ----------
  const eventos = new Collection({
    type: "base",
    name: "eventos",
    listRule: "",
    viewRule: "",
    createRule: null, // los eventos los crea solo el hook del servidor
    updateRule: null, // nadie los edita
    deleteRule: null, // nadie los borra
    fields: [
      {
        type: "relation",
        name: "orden",
        required: true,
        collectionId: ordenes.id,
        maxSelect: 1,
        cascadeDelete: false,
      },
      { type: "text", name: "de", required: true },
      { type: "text", name: "a", required: true },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
    ],
  });
  app.save(eventos);
}, (app) => {
  for (const nombre of ["eventos", "ordenes", "clientes"]) {
    try {
      app.delete(app.findCollectionByNameOrId(nombre));
    } catch (_) {
      // ya no existe
    }
  }
});
