import { ETIQUETAS } from "../estados.js";

export default function EstadoBadge({ estado }) {
  return <span className={`badge badge-${estado}`}>{ETIQUETAS[estado] ?? estado}</span>;
}
