import { Routes, Route } from "react-router";
import Layout from "./components/Layout.jsx";
import Resumen from "./pages/Resumen.jsx";
import ListaOrdenes from "./pages/ListaOrdenes.jsx";
import NuevaOrden from "./pages/NuevaOrden.jsx";
import DetalleOrden from "./pages/DetalleOrden.jsx";
import NoEncontrada from "./pages/NoEncontrada.jsx";

export default function App() {
  return (
    <Routes>
      {/* Diseño anidado: Layout dibuja la barra y un <Outlet /> donde entra cada página */}
      <Route element={<Layout />}>
        <Route index element={<Resumen />} />
        <Route path="ordenes" element={<ListaOrdenes />} />
        <Route path="ordenes/nueva" element={<NuevaOrden />} />
        {/* Parámetro de ruta: :id */}
        <Route path="ordenes/:id" element={<DetalleOrden />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
