import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { ExposicaoMetadata } from "../types/exposicao";
import { carregarExposicao } from "../utils/exposicaoUtils";
import "./ExposicaoVisor.css";

export default function ExposicaoVisor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exposicao, setExposicao] = useState<ExposicaoMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [scenarioUrl, setScenarioUrl] = useState<string | null>(null);

  useEffect(() => {
    const carregar = async () => {
      if (!id) {
        setErro("ID da exposição não encontrado");
        setLoading(false);
        return;
      }

      const dados = await carregarExposicao(id);

      if (!dados) {
        setErro("Não foi possível carregar a exposição");
        setLoading(false);
        return;
      }

      setExposicao(dados);

      // verifica se existe JSON no localStorage
      const saved = localStorage.getItem(`expo_json_${dados.fileName}`);

      if (saved) {
        const blob = new Blob([saved], { type: "application/json" });
        const blobUrl = URL.createObjectURL(blob);

        console.log("[ExposicaoVisor] Usando blob local:", blobUrl);
        setScenarioUrl(blobUrl);
      } else {
        // usa arquivo estático
        const staticUrl = `/exposicoes/${dados.fileName}`;
        console.log("[ExposicaoVisor] Usando arquivo estático:", staticUrl);
        setScenarioUrl(staticUrl);
      }

      setLoading(false);
    };

    carregar();
  }, [id]);

  if (loading) {
    return (
      <div className="exposicao-visor-container">
        <p>Carregando...</p>
      </div>
    );
  }

  if (erro || !exposicao) {
    return (
      <div className="exposicao-visor-container">
        <h2>Erro</h2>
        <p>{erro}</p>
        <button onClick={() => navigate("/exposicoes")}>Voltar</button>
      </div>
    );
  }

  return (
    <div className="exposicao-visor-container">
      <div className="exposicao-visor-header">
        <button onClick={() => navigate("/exposicoes")} className="back-button-header">
          ← Voltar
        </button>
        <div className="exposicao-info">
          <h1>{exposicao.name}</h1>
          {exposicao.author && <p className="author">por {exposicao.author}</p>}
          <p className="description">{exposicao.description}</p>
        </div>
      </div>

      <div className="exposicao-visor-viewer">
        {scenarioUrl ? (
          <iframe
            src={`/CenarioPlayer/index.html?scenarioUrl=${encodeURIComponent(scenarioUrl)}`}
            className="unity-frame"
            allow="fullscreen"
          />
        ) : (
          <p>Não foi possível determinar o JSON do cenário.</p>
        )}

      </div>
    </div>
  );
}
