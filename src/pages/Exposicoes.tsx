import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Exposicao } from "../types/exposicao";
import { carregarExposicoes } from "../utils/exposicaoUtils";
import "./Exposicoes.css";

export default function Exposicoes() {
  const [exposicoes, setExposicoes] = useState<Exposicao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      const dados = await carregarExposicoes();
      setExposicoes(dados.filter((e) => e.status === "published"));
      setLoading(false);
    };
    carregar();
  }, []);

  return (
    <div className="exposicoes-container">
      <div className="exposicoes-header">
        <h1>Exposições</h1>
        <p>Conheça as exposições do Acervo Artístico da UFSM</p>
      </div>

      <div className="exposicoes-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando exposições...</p>
          </div>
        ) : exposicoes.length === 0 ? (
          <p className="empty-state">
            Nenhuma exposição disponível no momento. Volte em breve!
          </p>
        ) : (
          <div className="exposicoes-grid">
            {exposicoes.map((expo) => (
              <div key={expo.id} className="exposicao-card">
                <div className="exposicao-header-card">
                  <h3>{expo.name}</h3>
                  {expo.author && <p className="author">por {expo.author}</p>}
                </div>
                <p className="description">{expo.description}</p>
                <p className="date">
                  {new Date(expo.createdAt).toLocaleDateString("pt-BR")}
                </p>
                <Link to={`/exposicoes/${expo.id}`} className="view-button">
                  Visualizar
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
