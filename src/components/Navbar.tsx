import { NavLink } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {

  const handleVisualizacao3D = () => {
    if (typeof window === "undefined") return;

    const selected = window.localStorage.getItem("selectedArtworks");

    if (!selected) {
      alert("Nenhuma obra selecionada.");
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = "https://projetosoftware2-ufsm.vercel.app/bridge";
    document.body.appendChild(iframe);

    iframe.onload = () => {
      if (!iframe.contentWindow) return;

      iframe.contentWindow.postMessage(
        {
          type: "SET_SELECTED_ARTWORKS",
          payload: selected,
        },
        "https://projetosoftware2-ufsm.vercel.app"
      );

      window.open("https://projetosoftware2-ufsm.vercel.app/", "_blank");
    };
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
