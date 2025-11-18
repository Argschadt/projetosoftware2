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

  useEffect(() => {
    const carregar = async () => {
      if (!id) {
        setErro("ID da exposição não encontrado");
        setLoading(false);
        return;
      }

      setLoading(true);
      const dados = await carregarExposicao(id);
      
      if (!dados) {
        setErro("Não foi possível carregar a exposição");
      } else {
        setExposicao(dados);
      }
      setLoading(false);
    };

    carregar();
  }, [id]);

  if (loading) {
    return (
      <div className="exposicao-visor-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando exposição...</p>
        </div>
      </div>
    );
  }

  if (erro || !exposicao) {
    return (
      <div className="exposicao-visor-container">
        <div className="error-state">
          <h2>Erro</h2>
          <p>{erro || "Exposição não encontrada"}</p>
          <button onClick={() => navigate("/exposicoes")} className="back-button">
            Voltar para Exposições
          </button>
        </div>
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
        {/* Aqui você pode integrar com o componente Unity para exibir a cena */}
        <div className="viewer-placeholder">
          <p>Visualizador 3D da exposição será carregado aqui</p>
          <p style={{ fontSize: "12px", color: "#999" }}>
            Arquivo: {exposicao.fileName}
          </p>
        </div>
      </div>
    </div>
  );
}
