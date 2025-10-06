import { NavLink } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span>Acervo 3D</span>
      </div>
      <div className="navbar-links">
        <NavLink
          to="/"
          className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}
          end
        >
          Início
        </NavLink>
        <NavLink
          to="/galeria"
          className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}
        >
          Galeria
        </NavLink>
        {/* Seleção removida - link eliminado */}
        <NavLink
          to="/unity"
          className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"}
        >
          Visualização 3D
        </NavLink>
      </div>
    </nav>
  );
}
