// src/utils/filterCache.ts
interface CachedFilters {
  authors: string[];
  dates: string[];
  types: string[];
  timestamp: number;
}

const CACHE_KEY = 'tainacan_filters_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas em ms

/**
 * Obtém os filtros do localStorage (cache local do navegador)
 */
export function getCachedFilters(): CachedFilters | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed: CachedFilters = JSON.parse(cached);
    const now = Date.now();
    const age = now - parsed.timestamp;

    // Verifica se o cache ainda é válido
    if (age > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('Erro ao ler cache de filtros:', error);
    return null;
  }
}

/**
 * Salva os filtros no localStorage
 */
export function setCachedFilters(
  authors: string[],
  dates: string[],
  types: string[]
): void {
  try {
    const cache: CachedFilters = {
      authors,
      dates,
      types,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log('Filtros salvos em cache');
  } catch (error) {
    console.warn('Erro ao salvar cache de filtros:', error);
  }
}

/**
 * Limpa o cache de filtros
 */
export function clearFilterCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('Cache de filtros limpo');
  } catch (error) {
    console.warn('Erro ao limpar cache de filtros:', error);
  }
}

/**
 * Verifica se o cache é válido
 */
export function isFilterCacheValid(): boolean {
  const cached = getCachedFilters();
  return cached !== null;
}
