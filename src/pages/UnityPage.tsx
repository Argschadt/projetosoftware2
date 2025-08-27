import { useState } from "react";
import UnityBuild from "../components/unitybuild";

export default function UnityPage() {
  const [showUnity, setShowUnity] = useState(true);

  return (
    <section style={{ padding: 24 }}>
      <h1>Visualização 3D</h1>
      <p style={{ opacity: 0.9 }}>Ative ou oculte o visualizador Unity.</p>
      <div style={{ margin: "16px 0" }}>
        <button onClick={() => setShowUnity((s) => !s)}>
          {showUnity ? "Ocultar Unity" : "Mostrar Unity"}
        </button>
      </div>

      {showUnity ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <UnityBuild buildPath="/unity/Build" />
        </div>
      ) : (
        <div
          style={{
            border: "1px dashed #555",
            padding: 24,
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          Visualizador oculto.
        </div>
      )}
    </section>
  );
}
