import { ETAPAS, ETIQUETAS } from "../estados.js";

// Muestra las 7 etapas y marca la actual. Si la orden salió por rechazada o cancelada,
// no hay "etapa actual" en la línea: se avisa aparte.
export default function Progreso({ estado }) {
  const indice = ETAPAS.indexOf(estado);
  return (
    <ol className="progreso">
      {ETAPAS.map((etapa, i) => {
        let clase = "";
        if (indice >= 0 && i < indice) clase = "hecha";
        if (i === indice) clase = "actual";
        return (
          <li key={etapa} className={clase}>
            {ETIQUETAS[etapa]}
          </li>
        );
      })}
    </ol>
  );
}
