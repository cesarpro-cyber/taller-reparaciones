import { NavLink, Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="app">
      <header className="barra">
        <h1>Taller de reparaciones</h1>
        <nav>
          <NavLink to="/" end>Resumen</NavLink>
          <NavLink to="/ordenes" end>Órdenes</NavLink>
          <NavLink to="/ordenes/nueva">Registrar equipo</NavLink>
        </nav>
      </header>
      <main className="contenido">
        <Outlet />
      </main>
    </div>
  );
}
