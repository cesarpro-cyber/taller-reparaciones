/// <reference path="../pb_data/types.d.ts" />

// Datos de prueba: 2 clientes y 5 ordenes en etapas distintas.
// Se cargan solos la primera vez que arranca PocketBase (las migraciones se aplican al iniciar).
// Se crean directamente en el servidor (sin pasar por la API), junto con su historial de eventos.
migrate((app) => {
  const colClientes = app.findCollectionByNameOrId("clientes");
  const colOrdenes = app.findCollectionByNameOrId("ordenes");
  const colEventos = app.findCollectionByNameOrId("eventos");

  const crearCliente = (nombre, telefono) => {
    const r = new Record(colClientes);
    r.set("nombre", nombre);
    r.set("telefono", telefono);
    app.save(r);
    return r;
  };

  // "camino" es la lista de etapas por las que paso la orden, en orden.
  // La orden queda en la ultima y se genera un evento por cada cambio.
  const crearOrden = (cliente, datos, camino) => {
    const o = new Record(colOrdenes);
    o.set("cliente", cliente.id);
    o.set("manoObra", 0);
    for (const campo in datos) o.set(campo, datos[campo]);
    o.set("estado", camino[camino.length - 1]);
    app.save(o);

    for (let i = 1; i < camino.length; i++) {
      const ev = new Record(colEventos);
      ev.set("orden", o.id);
      ev.set("de", camino[i - 1]);
      ev.set("a", camino[i]);
      app.save(ev);
    }
    return o;
  };

  const ana = crearCliente("Ana Martínez", "787-555-0101");
  const luis = crearCliente("Luis Rivera", "787-555-0102");

  // 1) solicitada (recien llegada)
  crearOrden(ana, {
    equipo: "Laptop Lenovo IdeaPad 3",
    problema: "No enciende. Quedó sin carga y el cargador parece no funcionar.",
  }, ["solicitada"]);

  // 2) en_diagnostico
  crearOrden(luis, {
    equipo: "Teléfono Samsung Galaxy A32",
    problema: "La pantalla se ve con líneas verdes y no responde al tacto.",
  }, ["solicitada", "en_diagnostico"]);

  // 3) presupuestada (esperando respuesta del cliente)
  crearOrden(ana, {
    equipo: "Televisor LG 43 pulgadas",
    problema: "Se escucha, pero no hay imagen.",
    diagnostico: "Falla en la tira de LEDs de retroiluminación.",
    manoObra: 60,
    piezas: [{ descripcion: "Tira LED retroiluminación 43\"", cantidad: 1, precio: 85 }],
  }, ["solicitada", "en_diagnostico", "presupuestada"]);

  // 4) en_reparacion
  crearOrden(luis, {
    equipo: "Laptop HP Pavilion 15",
    problema: "Se calienta mucho y se apaga sola.",
    diagnostico: "Ventilador atascado y pasta térmica seca.",
    manoObra: 45,
    piezas: [
      { descripcion: "Ventilador de CPU", cantidad: 1, precio: 22 },
      { descripcion: "Pasta térmica", cantidad: 1, precio: 6 },
    ],
  }, ["solicitada", "en_diagnostico", "presupuestada", "aprobada", "en_reparacion"]);

  // 5) entregada (orden cerrada)
  crearOrden(ana, {
    equipo: "iPhone 11",
    problema: "La batería dura muy poco.",
    diagnostico: "Batería degradada al 62% de capacidad.",
    manoObra: 30,
    piezas: [{ descripcion: "Batería iPhone 11", cantidad: 1, precio: 40 }],
  }, [
    "solicitada", "en_diagnostico", "presupuestada", "aprobada",
    "en_reparacion", "lista", "entregada",
  ]);
}, (app) => {
  // Revertir: vacia las colecciones de prueba
  for (const nombre of ["eventos", "ordenes", "clientes"]) {
    try {
      app.truncateCollection(app.findCollectionByNameOrId(nombre));
    } catch (_) {
      // la coleccion no existe
    }
  }
});
