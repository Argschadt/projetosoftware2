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

    // Não usar display:none (browser ignora)
    iframe.style.position = "absolute";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";

    iframe.src = "https://projetosoftware2-ufsm.vercel.app/mapaPadraoBuild/bridge.html";
    document.body.appendChild(iframe);

    iframe.addEventListener("load", () => {
      if (!iframe.contentWindow) return;

      iframe.contentWindow.postMessage(
        {
          type: "SET_SELECTED_ARTWORKS",
          payload: selected,
        },
        "https://projetosoftware2-ufsm.vercel.app"
      );

      // ❌ NÃO REDIRECIONA AQUI!
      // O BRIDGE é quem vai redirecionar depois de salvar.
    });


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
