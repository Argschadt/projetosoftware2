// utils/exposicaoUtils.ts
import type { Exposicao, ExposicaoMetadata, ExposicaoSceneData } from '../types/exposicao';

const LS_KEY = "exposicoes_local";

// ------------------------------------------------------------
// Helpers de LocalStorage
// ------------------------------------------------------------
function loadLocal(): Exposicao[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocal(lista: Exposicao[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(lista));
}

// ------------------------------------------------------------
// 1. CARREGAR LISTA (estáticos + localStorage)
// ------------------------------------------------------------
export async function carregarExposicoes(): Promise<Exposicao[]> {
  const locais = loadLocal();

  // carregar lista estática em /public/exposicoes/index.json
  try {
    const resp = await fetch("/exposicoes/index.json");
    if (resp.ok) {
      const estaticas = await resp.json();
      return [...estaticas, ...locais];
    }
  } catch {}

  // fallback — só localStorage
  return locais;
}

// ------------------------------------------------------------
// 2. CARREGAR UMA EXPOSIÇÃO COMPLETA
// ------------------------------------------------------------
export async function carregarExposicao(id: string): Promise<ExposicaoMetadata | null> {
  const locais = loadLocal();
  const local = locais.find(x => x.id === id);

  // --- Caso venha do localStorage ---
  if (local) {
    const raw = localStorage.getItem(`expo_json_${local.fileName}`);
    if (!raw) return null;

    return {
      ...local,
      data: JSON.parse(raw) as ExposicaoSceneData,
    };
  }

  // --- Caso venha dos arquivos estáticos ---
  try {
    // Carregar index.json para obter o fileName
    const listaResp = await fetch("/exposicoes/index.json");
    if (!listaResp.ok) return null;

    const estaticas: Exposicao[] = await listaResp.json();
    const meta = estaticas.find(x => x.id === id);
    if (!meta) return null;

    // Agora sim carregar o JSON correto pelo fileName
    const resp = await fetch(`/exposicoes/${meta.fileName}`);
    if (!resp.ok) return null;

    const cena = await resp.json();

    return {
      ...meta,   // metadados
      data: cena // JSON do mapa sem wrapper
    };
  } catch (e) {
    console.error("Erro ao carregar exposição estática:", e);
    return null;
  }
}

// ------------------------------------------------------------
// 3. SALVAR EXPOSIÇÃO DO ADMIN (somente localStorage)
// ------------------------------------------------------------
export async function salvarExposicao(expo: Exposicao, arquivo: File): Promise<boolean> {
  try {
    const text = await arquivo.text();
    const cena = JSON.parse(text);

    // salvar metadados
    const lista = loadLocal();
    lista.push(expo);
    saveLocal(lista);

    // salvar JSON da cena
    localStorage.setItem(`expo_json_${expo.fileName}`, JSON.stringify(cena));

    return true;
  } catch (e) {
    console.error("Erro ao salvar exposição:", e);
    return false;
  }
}

// ------------------------------------------------------------
// 4. DELETAR
// ------------------------------------------------------------
export async function deletarExposicao(id: string): Promise<boolean> {
  const lista = loadLocal();
  const expo = lista.find(x => x.id === id);
  if (!expo) return false;

  localStorage.removeItem(`expo_json_${expo.fileName}`);

  const nova = lista.filter(x => x.id !== id);
  saveLocal(nova);

  return true;
}
