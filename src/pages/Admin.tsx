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
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    author: "",
    status: "draft" as "draft" | "published",
  });
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

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      alert("Por favor, selecione um arquivo JSON");
      return;
    }

    if (!formData.name || !formData.description) {
      alert("Por favor, preencha todos os campos");
      return;
    }

    setSaving(true);

    const exposicao: Exposicao = {
      id: formData.name.toLowerCase().replace(/\s+/g, "-"),
      name: formData.name,
      description: formData.description,
      fileName: selectedFile.name,
      createdAt: new Date().toISOString(),
      author: formData.author || undefined,
      status: formData.status,
    };

    const success = await salvarExposicao(exposicao, selectedFile);

    if (success) {
      alert("Exposição salva com sucesso!");
      setFormData({ name: "", description: "", author: "", status: "draft" });
      setSelectedFile(null);
      setShowForm(false);
      carregarListaExposicoes();
    } else {
      alert("Erro ao salvar exposição");
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
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn btn-primary"
            >
              {showForm ? "Cancelar" : "+ Nova Exposição"}
            </button>
          </div>

          {showForm && (
            <div className="form-section">
              <h3>Adicionar Nova Exposição</h3>
              <p style={{ fontSize: 13, color: '#666' }}>
                Nota: Em ambiente de desenvolvimento, a gravação de arquivos JSON no
                servidor pode não funcionar — neste caso a exposição será salva no
                seu navegador (localStorage) apenas para testes.
              </p>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Nome da Exposição *</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Ex: Mapa 1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Descrição *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Descreva a exposição"
                    rows={4}
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="author">Autor (opcional)</label>
                  <input
                    id="author"
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleFormChange}
                    placeholder="Autor da exposição"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                  >
                    <option value="draft">Rascunho</option>
                    <option value="published">Publicado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="file">Arquivo JSON *</label>
                  <input
                    id="file"
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    required
                  />
                  {selectedFile && (
                    <p className="file-info">
                      Arquivo selecionado: {selectedFile.name}
                    </p>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-success"
                  >
                    {saving ? "Salvando..." : "Salvar Exposição"}
                  </button>
                </div>
              </form>
            </div>
          )}

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
                      <th>Autor</th>
                      <th>Status</th>
                      <th>Data</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exposicoes.map((expo) => (
                      <tr key={expo.id}>
                        <td>{expo.name}</td>
                        <td>{expo.author || "-"}</td>
                        <td>
                          <span className={`status-badge ${expo.status}`}>
                            {expo.status === "published"
                              ? "Publicado"
                              : "Rascunho"}
                          </span>
                        </td>
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
