// Etapas de una orden. El servidor es quien manda; esto solo ordena la interfaz.
export const ETAPAS = [
  "solicitada",
  "en_diagnostico",
  "presupuestada",
  "aprobada",
  "en_reparacion",
  "lista",
  "entregada",
];
export const SALIDAS = ["rechazada", "cancelada"];
export const TODOS = [...ETAPAS, ...SALIDAS];

export const ETIQUETAS = {
  solicitada: "Solicitada",
  en_diagnostico: "En diagnóstico",
  presupuestada: "Presupuestada",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  en_reparacion: "En reparación",
  lista: "Lista",
  entregada: "Entregada",
  cancelada: "Cancelada",
};

// Botones que se ofrecen según la etapa actual (en_diagnostico usa un formulario aparte).
export const ACCIONES = {
  solicitada: [
    { estado: "en_diagnostico", texto: "Empezar diagnóstico" },
    { estado: "cancelada", texto: "Cancelar orden", peligro: true },
  ],
  en_diagnostico: [],
  presupuestada: [
    { estado: "aprobada", texto: "El cliente aprobó el presupuesto" },
    { estado: "rechazada", texto: "El cliente rechazó el presupuesto", peligro: true },
  ],
  aprobada: [{ estado: "en_reparacion", texto: "Empezar reparación" }],
  en_reparacion: [{ estado: "lista", texto: "Terminar reparación" }],
  lista: [{ estado: "entregada", texto: "Entregar equipo al cliente" }],
  rechazada: [],
  cancelada: [],
  entregada: [],
};
