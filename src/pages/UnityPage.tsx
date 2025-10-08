import { useState } from "react";
import UnityBuild from "../components/unitybuild";
import "./UnityPage.css";

export default function UnityPage() {
  const [showUnity, setShowUnity] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("unity:show");
      if (saved !== null) return saved === "true";
    } catch {
      // ignore storage errors
    }
    return false; // default: start hidden
  });

  const toggleUnity = () =>
    setShowUnity((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("unity:show", String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });

  return (
    <section className="unity-section">
      <h1>Visualização 3D</h1>
      <p className="unity-description">Ative ou oculte o visualizador Unity.</p>
      <div className="unity-controls">
        <div className="unity-toggle">
          <button className="unity-button" onClick={toggleUnity}>
            {showUnity ? "Ocultar Unity" : "Mostrar Unity"}
          </button>
        </div>
      </div>

      {showUnity ? (
        <div className="unity-viewer">
          <UnityBuild buildPath="/testesMapBuild/Build" />
        </div>
      ) : (
        <div className="unity-placeholder">
          Visualizador oculto.
        </div>
      )}
    </section>
  );
}
