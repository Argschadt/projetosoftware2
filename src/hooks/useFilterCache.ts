// src/hooks/useFilterCache.ts
import { useEffect, useState } from 'react';
import { getCachedFilters, setCachedFilters } from '../utils/filterCache';

interface Filters {
  authors: string[];
  dates: string[];
  types: string[];
}

interface UseFilterCacheReturn {
  filters: Filters | null;
  isLoading: boolean;
  isCached: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook para carregar filtros com cache
 * @param fetchFn - Função que busca os filtros do servidor
 * @returns Objeto com filtros, loading state e função de refetch
 */
export function useFilterCache(
  fetchFn: () => Promise<Filters>
): UseFilterCacheReturn {
  const [filters, setFilters] = useState<Filters | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);

  const loadFilters = async () => {
    try {
      // Tenta carregar do cache
      const cached = getCachedFilters();
      if (cached) {
        setFilters({
          authors: cached.authors,
          dates: cached.dates,
          types: cached.types,
        });
        setIsCached(true);
        setIsLoading(false);

        // Atualiza em background
        setTimeout(() => {
          refetch();
        }, 2000);
        return;
      }

      // Se não houver cache, busca do servidor
      setIsCached(false);
      const fetchedFilters = await fetchFn();
      setFilters(fetchedFilters);
      setCachedFilters(
        fetchedFilters.authors,
        fetchedFilters.dates,
        fetchedFilters.types
      );
    } catch (error) {
      console.error('Erro ao carregar filtros:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async () => {
    try {
      const fetchedFilters = await fetchFn();
      setFilters(fetchedFilters);
      setCachedFilters(
        fetchedFilters.authors,
        fetchedFilters.dates,
        fetchedFilters.types
      );
      console.log('Filtros atualizados com sucesso');
    } catch (error) {
      console.warn('Erro ao atualizar filtros:', error);
    }
  };

  useEffect(() => {
    loadFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    filters,
    isLoading,
    isCached,
    refetch,
  };
}
