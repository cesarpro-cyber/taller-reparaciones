/// <reference path="../pb_data/types.d.ts" />

// ---------------------------------------------------------------------------
// 1) CREAR una orden: siempre nace "solicitada" y sin presupuesto.
// ---------------------------------------------------------------------------
onRecordCreateRequest((e) => {
  const lib = require(`${__hooks}/ordenes_lib.js`);

  if (!e.record.getString("estado")) {
    e.record.set("estado", "solicitada");
  }
  if (e.record.getString("estado") !== "solicitada") {
    throw new BadRequestError("Una orden nueva debe empezar en 'solicitada'.");
  }

  const piezas = lib.leerPiezas(e.record);
  const piezasVacias = piezas === null || (Array.isArray(piezas) && piezas.length === 0);
  if (
    e.record.getString("diagnostico") !== "" ||
    e.record.getFloat("manoObra") !== 0 ||
    !piezasVacias
  ) {
    throw new BadRequestError("El presupuesto solo se registra al pasar a 'presupuestada'.");
  }

  e.next();
}, "ordenes");

// ---------------------------------------------------------------------------
// 2) ACTUALIZAR una orden: valida la transicion y la inmutabilidad.
// ---------------------------------------------------------------------------
onRecordUpdateRequest((e) => {
  const lib = require(`${__hooks}/ordenes_lib.js`);

  const antes = e.record.original();
  const de = antes.getString("estado");
  const a = e.record.getString("estado");

  const permitidas = lib.TRANSICIONES[de];
  if (!permitidas) {
    throw new BadRequestError(`Estado actual desconocido: '${de}'.`);
  }

  // Estados finales (rechazada, cancelada, entregada): no cambian mas.
  if (permitidas.length === 0) {
    throw new BadRequestError(`La orden está '${de}' y ya no admite cambios.`);
  }

  // Despues de crearla, la unica modificacion valida es un cambio de etapa permitido.
  if (!permitidas.includes(a)) {
    throw new BadRequestError(
      de === a
        ? "Una orden solo se modifica cambiando de etapa."
        : `Transición no permitida: ${de} -> ${a}.`
    );
  }

  // Datos que nunca cambian despues de registrar la orden.
  for (const campo of ["cliente", "equipo", "problema"]) {
    if (e.record.getString(campo) !== antes.getString(campo)) {
      throw new BadRequestError(`El campo '${campo}' no se puede modificar.`);
    }
  }
  if (JSON.stringify(e.record.get("fotos")) !== JSON.stringify(antes.get("fotos"))) {
    throw new BadRequestError("Las fotos solo se cargan al registrar la orden.");
  }

  // Presupuesto: solo se escribe en la transicion en_diagnostico -> presupuestada.
  const registrandoPresupuesto = de === "en_diagnostico" && a === "presupuestada";

  if (registrandoPresupuesto) {
    if (e.record.getString("diagnostico").trim() === "") {
      throw new BadRequestError("El diagnóstico es obligatorio para presupuestar.");
    }
    if (!(e.record.getFloat("manoObra") >= 0)) {
      throw new BadRequestError("La mano de obra debe ser un número mayor o igual a 0.");
    }
    const piezas = lib.leerPiezas(e.record);
    if (piezas === undefined || piezas === null) {
      throw new BadRequestError("'piezas' debe ser una lista (puede estar vacía).");
    }
    const problemaPiezas = lib.errorEnPiezas(piezas);
    if (problemaPiezas) {
      throw new BadRequestError(problemaPiezas);
    }
  } else {
    if (e.record.getString("diagnostico") !== antes.getString("diagnostico")) {
      throw new BadRequestError("El presupuesto no se puede modificar: 'diagnostico'.");
    }
    if (e.record.getFloat("manoObra") !== antes.getFloat("manoObra")) {
      throw new BadRequestError("El presupuesto no se puede modificar: 'manoObra'.");
    }
    if (JSON.stringify(lib.leerPiezas(e.record)) !== JSON.stringify(lib.leerPiezas(antes))) {
      throw new BadRequestError("El presupuesto no se puede modificar: 'piezas'.");
    }
  }

  e.next();
}, "ordenes");

// ---------------------------------------------------------------------------
// 3) HISTORIAL: un evento por cada cambio de etapa.
//    Se crea desde el servidor, dentro de la misma transaccion que guarda la orden:
//    o se guardan los dos, o ninguno. La fecha la pone PocketBase (autodate).
// ---------------------------------------------------------------------------
onRecordUpdate((e) => {
  const de = e.record.original().getString("estado");
  const a = e.record.getString("estado");

  e.next(); // guarda la orden

  if (de !== a) {
    const evento = new Record(e.app.findCollectionByNameOrId("eventos"));
    evento.set("orden", e.record.id);
    evento.set("de", de);
    evento.set("a", a);
    e.app.save(evento);
  }
}, "ordenes");
