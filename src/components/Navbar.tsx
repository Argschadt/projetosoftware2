import { NavLink } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {

  const handleVisualizacao3D = () => {
    const selected = localStorage.getItem("selectedArtworks");

    if (!selected) {
      alert("Nenhuma obra selecionada.");
      return;
    }

    // Abre o bridge numa nova aba
    const popup = window.open(
      "https://projetosoftware2-ufsm.vercel.app/mapaPadraoBuild/bridge.html",
      "_blank"
    );

    if (!popup) {
      alert("Permita popups para continuar!");
      return;
    }

    // Quando a aba carregar, enviamos os dados
    const interval = setInterval(() => {
      if (popup.closed) {
        clearInterval(interval);
        return;
      }

      popup.postMessage(
        {
          type: "SET_SELECTED_ARTWORKS",
          payload: selected
        },
        "https://projetosoftware2-ufsm.vercel.app"
      );

    }, 300);
  };


  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span>Acervo 3D</span>
      </div>

      <div className="navbar-links">
        <NavLink to="/" className={({ isActive }) =>
          isActive ? "navbar-link active" : "navbar-link"
        } end>
          Início
        </NavLink>

        <NavLink to="/galeria" className={({ isActive }) =>
          isActive ? "navbar-link active" : "navbar-link"
        }>
          Galeria
        </NavLink>

        <NavLink to="/exposicoes" className={({ isActive }) =>
          isActive ? "navbar-link active" : "navbar-link"
        }>
          Exposições
        </NavLink>

        <button
          type="button"
          className="navbar-link"
          onClick={handleVisualizacao3D}
        >
          Visualização 3D
        </button>
      </div>
    </nav>
  );
}
