import type { Exposicao, ExposicaoMetadata, ExposicaoSceneData } from '../types/exposicao';

const EXPOSICOES_API = '/api/exposicoes';
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
      try {
        const local = localStorage.getItem('localExposicoes');
        if (local) {
          const parsed = JSON.parse(local) as Exposicao[];
          return [...(json as Exposicao[]), ...parsed];
        }
      } catch (e) {}
      return json as Exposicao[];
    }
    // In some setups the API returns an object with metadata list
    if (json && json.items && Array.isArray(json.items)) return json.items as Exposicao[];
    return [];
  } catch (error) {
    console.error('Erro ao carregar exposições:', error);
    // Fallback: tenta carregar um index estático em /exposicoes/index.json
    try {
      const fallback = await fetch(`${EXPOSICOES_PATH}/index.json`);
      if (!fallback.ok) throw new Error('No fallback index');
      return await fallback.json();
    } catch (e) {
      // último recurso: tenta carregar Mapa1.json se existir
      try {
        const map = await fetch(`${EXPOSICOES_PATH}/Mapa1.json`);
        if (map.ok) {
          const json = await map.json();
          return [
            {
              id: 'Mapa1',
              name: json.name || 'Mapa1',
              description: json.description || '',
              fileName: 'Mapa1.json',
              createdAt: json.createdAtIso || json.createdAt || '',
              author: json.author || null,
              status: 'published',
            },
          ];
        }
      } catch (e2) {}
    }
    // ainda tenta recuperar exposições locais salvas no navegador (para dev)
    try {
      const local = localStorage.getItem('localExposicoes');
      if (local) return JSON.parse(local) as Exposicao[];
    } catch (e) {}
    return [];
  }
}

/**
 * Carrega uma exposição específica com seus dados
 */
export async function carregarExposicao(id: string): Promise<ExposicaoMetadata | null> {
  try {
  const response = await fetch(`${EXPOSICOES_API}/${id}`);
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
    // fallback to static json file
    try {
      const fallback = await fetch(`${EXPOSICOES_PATH}/${id}.json`);
      if (!fallback.ok) throw new Error('fail fallback');
      const data = await fallback.json();
      return {
        id,
        name: data.name || id,
        description: data.description || '',
        fileName: `${id}.json`,
        createdAt: data.createdAtIso || data.createdAt || '',
        data,
      } as ExposicaoMetadata;
    } catch (e) {
      // também tenta buscar em localStorage (dev)
      try {
        const local = localStorage.getItem('localExposicoes');
        if (local) {
          const parsed = JSON.parse(local) as Exposicao[];
          const found = parsed.find((p) => p.id === id);
          if (found) {
            const content = await fetch(`${EXPOSICOES_PATH}/${found.fileName}`).then(async (r) => {
              if (r.ok) return await r.json();
              // when saved to localStorage we store 'data' as an extra field
              return (found as any).data ?? null;
            });
            return {
              ...found,
              data: content as ExposicaoSceneData,
            } as ExposicaoMetadata;
          }
        }
      } catch (e) {}
      return null;
    }
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

    const response = await fetch(`${EXPOSICOES_API}/save`, {
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
    // fallback: Save to localStorage (dev only)
    try {
      const local = localStorage.getItem('localExposicoes');
      const arr: Exposicao[] = local ? JSON.parse(local) : [];
      // Save the file content as 'data' property so we can view it in dev
      const fileText = await arquivo.text();
      const devEntry = { ...exposicao, data: JSON.parse(fileText) } as any;
      arr.push(devEntry);
      localStorage.setItem('localExposicoes', JSON.stringify(arr));
      return true;
    } catch (e) {
      console.error('Fail fallback to localStorage', e);
    }
    return false;
  }
}

/**
 * Deleta uma exposição (apenas admin)
 */
export async function deletarExposicao(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${EXPOSICOES_API}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Falha ao deletar exposição');
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar exposição:', error);
    // fallback: delete from localStorage list
    try {
      const local = localStorage.getItem('localExposicoes');
      if (!local) return false;
      const parsed = JSON.parse(local) as any[];
      const filtered = parsed.filter((p) => p.id !== id);
      localStorage.setItem('localExposicoes', JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error('Erro ao deletar localmente', e);
    }
    return false;
  }
}
