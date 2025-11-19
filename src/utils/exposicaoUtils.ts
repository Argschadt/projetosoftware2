import type { Exposicao, ExposicaoMetadata, ExposicaoSceneData } from '../types/exposicao';

const EXPOSICOES_API = 'http://localhost:3000/api/exposicoes';
const EXPOSICOES_PATH = '/exposicoes';

/**
 * Carrega a lista de exposições disponíveis
 */
export async function carregarExposicoes(): Promise<Exposicao[]> {
  try {
  const response = await fetch(`${EXPOSICOES_API}?action=list`);
    if (!response.ok) {
      throw new Error('Falha ao carregar exposições');
    }
    const json = await response.json();
    // API should return an array of exposicoes
    if (Array.isArray(json)) {
      return json as Exposicao[];
    }
    // In some setups the API returns an object with metadata list
    if (json && json.items && Array.isArray(json.items)) return json.items as Exposicao[];
    return [];
  } catch (error) {
    console.error('Erro ao carregar exposições:', error);
    return [];
  }
}

/**
 * Carrega uma exposição específica com seus dados
 */
export async function carregarExposicao(id: string): Promise<ExposicaoMetadata | null> {
  try {
  const response = await fetch(`${EXPOSICOES_API}?id=${id}`);
    if (!response.ok) {
      throw new Error('Falha ao carregar exposição');
    }
    const json = await response.json();
    if (json && json.metadata && json.data) {
      return { ...json.metadata, data: json.data } as ExposicaoMetadata;
    }
    return json as ExposicaoMetadata;
  } catch (error) {
    console.error('Erro ao carregar exposição:', error);
    return null;
  }
}

/**
 * Carrega o arquivo JSON da exposição diretamente
 */
export async function carregarDadosExposicao(fileName: string): Promise<ExposicaoSceneData | null> {
  try {
    const response = await fetch(`${EXPOSICOES_PATH}/${fileName}`);
    if (!response.ok) {
      throw new Error('Falha ao carregar dados da exposição');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao carregar dados da exposição:', error);
    return null;
  }
}

/**
 * Salva uma nova exposição (apenas admin)
 */
export async function salvarExposicao(exposicao: Exposicao, arquivo: File): Promise<boolean> {
  try {
    // Ler o conteúdo do arquivo (JSON)
    const fileText = await arquivo.text();

    const body = {
      metadata: exposicao,
      data: fileText,
    };

    const response = await fetch(EXPOSICOES_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Falha ao salvar exposição');
    }

    return true;
  } catch (error) {
    console.error('Erro ao salvar exposição:', error);
    return false;
  }
}

/**
 * Deleta uma exposição (apenas admin)
 */
export async function deletarExposicao(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${EXPOSICOES_API}?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Falha ao deletar exposição');
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar exposição:', error);
    return false;
  }
}
