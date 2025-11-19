import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import type { Exposicao } from "../types/exposicao";
import { carregarExposicoes, salvarExposicao, deletarExposicao } from "../utils/exposicaoUtils";
import "./Admin.css";

export default function Admin() {
  const { logout, username } = useAuth();
  const navigate = useNavigate();
  const [exposicoes, setExposicoes] = useState<Exposicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    carregarListaExposicoes();
  }, []);

  const carregarListaExposicoes = async () => {
    setLoading(true);
    const dados = await carregarExposicoes();
    setExposicoes(dados);
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Por favor, selecione um arquivo");
      return;
    }

    setSaving(true);

    // Usar o nome do arquivo como título
    const fileName = selectedFile.name;
    const name = fileName.replace(/\.[^/.]+$/, ""); // Remover extensão para o nome
    const id = name.toLowerCase().replace(/\s+/g, "-");

    const exposicao: Exposicao = {
      id,
      name,
      description: "", // Não usado
      fileName,
      createdAt: new Date().toISOString(),
      author: undefined,
      status: "published", // Sempre publicado
    };

    const success = await salvarExposicao(exposicao, selectedFile);

    if (success) {
      alert("Arquivo enviado com sucesso!");
      setSelectedFile(null);
      carregarListaExposicoes();
    } else {
      alert("Erro ao enviar arquivo");
    }

    setSaving(false);
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Painel de Admin</h1>
        <div className="admin-user-info">
          <span>
            Bem-vindo, <strong>{username}</strong>
          </span>
          <button onClick={handleLogout} className="logout-button">
            Sair
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-section">
          <div className="section-header">
            <h2>Gerenciar Exposições</h2>
          </div>

          <div className="upload-section">
            <h3>Upload de Arquivo</h3>
            <div className="form-group">
              <label htmlFor="file">Selecione o arquivo JSON</label>
              <input
                id="file"
                type="file"
                accept=".json"
                onChange={handleFileChange}
              />
              {selectedFile && (
                <p className="file-info">
                  Arquivo selecionado: {selectedFile.name}
                </p>
              )}
            </div>
            <div className="form-actions">
              <button
                onClick={handleUpload}
                disabled={saving || !selectedFile}
                className="btn btn-success"
              >
                {saving ? "Enviando..." : "Enviar Arquivo"}
              </button>
            </div>
          </div>

          <div className="exposicoes-table-section">
            <h3>Exposições Cadastradas</h3>
            {loading ? (
              <p className="loading-text">Carregando...</p>
            ) : exposicoes.length === 0 ? (
              <p className="empty-text">Nenhuma exposição cadastrada</p>
            ) : (
              <div className="table-responsive">
                <table className="exposicoes-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Data</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exposicoes.map((expo) => (
                      <tr key={expo.id}>
                        <td>{expo.name}</td>
                        <td>
                          {new Date(expo.createdAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-small btn-danger"
                            onClick={async () => {
                              if (!confirm(`Remover exposição ${expo.name}?`)) return;
                              const ok = await deletarExposicao(expo.id);
                              if (ok) carregarListaExposicoes();
                              else alert('Falha ao deletar');
                            }}
                          >
                            Deletar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
