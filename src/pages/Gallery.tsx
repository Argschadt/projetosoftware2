import React, { useEffect, useState, useCallback } from "react";
import ImageCard from "../components/ImageCard";
import FilterSidebar from "../components/FilterSidebar";
import "./Gallery.css";
import { DEFAULT_COLLECTION_ID } from "../config";
import type { Item, ApiItem } from "../types";
import { getCachedFilters, setCachedFilters } from "../utils/filterCache";

const COLLECTION_ID = DEFAULT_COLLECTION_ID;

const Gallery: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  const [allAuthors, setAllAuthors] = useState<string[]>([]);
  const [allDates, setAllDates] = useState<string[]>([]);
  const [allTypes, setAllTypes] = useState<string[]>([]);

  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  // selection state for gallery items (ids)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  // state for selected items data
  const [selectedItemsData, setSelectedItemsData] = useState<Item[]>([]);

  // Carregar seleção do localStorage na montagem
  useEffect(() => {
    const savedSelection = localStorage.getItem('gallerySelection');
    if (savedSelection) {
      try {
        const parsed = JSON.parse(savedSelection);
        if (Array.isArray(parsed)) {
          setSelectedIds(new Set(parsed));
        }
      } catch (error) {
        console.warn('Erro ao carregar seleção do localStorage:', error);
      }
    }
    
    const savedItemsData = localStorage.getItem('gallerySelectedItemsData');
    if (savedItemsData) {
      try {
        const parsed = JSON.parse(savedItemsData);
        if (Array.isArray(parsed)) {
          setSelectedItemsData(parsed);
        }
      } catch (error) {
        console.warn('Erro ao carregar dados dos itens selecionados:', error);
      }
    }
  }, []);

  // Salvar seleção no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('gallerySelection', JSON.stringify(Array.from(selectedIds)));
  }, [selectedIds]);

  // Atualizar dados dos itens selecionados quando items ou selectedIds mudam
  useEffect(() => {
    const currentSelectedData = items.filter(item => selectedIds.has(item.id));
    const updatedSelectedData = [...selectedItemsData];
    
    // Adicionar novos itens selecionados
    currentSelectedData.forEach(item => {
      if (!updatedSelectedData.some(selected => selected.id === item.id)) {
        updatedSelectedData.push(item);
      }
    });
    
    // Remover itens que não estão mais selecionados
    const filteredData = updatedSelectedData.filter(item => selectedIds.has(item.id));
    
    if (JSON.stringify(filteredData) !== JSON.stringify(selectedItemsData)) {
      setSelectedItemsData(filteredData);
      localStorage.setItem('gallerySelectedItemsData', JSON.stringify(filteredData));
    }
  }, [items, selectedIds, selectedItemsData]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Efeito unificado para buscar itens sempre que a página ou os filtros mudarem
  // fetchItems é uma função interna que muda a cada render
  useEffect(() => {
    const controller = new AbortController();
    fetchItems(page, controller.signal).catch((e: unknown) => {
      if ((e as { name?: string })?.name === 'AbortError') return;
      console.error('fetchItems failed:', e);
    });
    return () => controller.abort();
  }, [page, selectedAuthors, selectedDates, selectedTypes]);

  // Efeito para resetar a página quando os filtros são alterados
  // page está omitida intencionalmente para evitar loop infinito
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [selectedAuthors, selectedDates, selectedTypes]);

  const handleAuthorChange = useCallback((author: string) => {
    setSelectedAuthors((prev) => 
      prev.includes(author) ? prev.filter((a) => a !== author) : [...prev, author]
    );
  }, []);

  const handleDateChange = useCallback((date: string) => {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  }, []);

  const handleTypeChange = useCallback((type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function saveSelection() {
    // Usa os dados completos dos itens selecionados (de todas as páginas)
    const selectedData = selectedItemsData.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      // usa a imagem disponível no item quando houver
      imageUrl: item.imageUrl ?? null,
    }));

    // Salva no localStorage como string JSON
    try {
      localStorage.setItem('selectedArtworks', JSON.stringify(selectedData));
      console.log('Selecionados salvos no localStorage:', selectedData);
      alert(`Seleção salva! ${selectedData.length} obras armazenadas.`);
    } catch (e) {
      console.error('Falha ao salvar seleção:', e);
      alert('Não foi possível salvar a seleção. Verifique se o localStorage está disponível.');
    }
  }

  async function fetchFilterOptions() {
    setLoadingFilters(true);
    try {
      // ✅ Otimização: Tenta carregar do cache primeiro
      const cached = getCachedFilters();
      if (cached) {
        console.log('Carregando filtros do cache');
        setAllAuthors(cached.authors);
        setAllDates(cached.dates);
        setAllTypes(cached.types);
        setLoadingFilters(false);

        // Atualiza em background sem bloquear a UI
        updateFiltersInBackground();
        return;
      }

      // Se não houver cache, busca do servidor
      await fetchFiltersFromServer();
    } catch (error) {
      console.error("Failed to fetch filter options from item list:", error);
      // Em caso de falha, a lista de filtros ficará vazia, mas a galeria principal ainda funciona.
      setLoadingFilters(false);
    }
  }

  /**
   * Busca os filtros do servidor e atualiza o cache
   */
  async function fetchFiltersFromServer() {
    try {
      // Busca as primeiras 5 páginas (até 500 itens) para gerar filtros
      const pagePromises = [1, 2, 3, 4, 5].map((p) =>
        fetch(`/api/tainacan/items?collection=${COLLECTION_ID}&perpage=100&page=${p}&paged=${p}&order=ASC&orderby=date`).then((res) => res.json())
      );

      const [page1Data, page2Data, page3Data, page4Data, page5Data] = await Promise.all(pagePromises);

      const itemsFromApi = [
        ...(page1Data.items || []),
        ...(page2Data.items || []),
        ...(page3Data.items || []),
        ...(page4Data.items || []),
        ...(page5Data.items || []),
      ];

      const authors = new Set<string>();
      const dates = new Set<string>();
      const types = new Set<string>();

      for (const item of itemsFromApi) {
        const metadata = item.metadata || {};
        const author = (metadata['taxonomia']?.value as Array<{ name: string }>)?.[0]?.name;
        const date = metadata['data-da-obra-2']?.value;
        const type = (metadata['tecnica-3']?.value as { name?: string })?.name;

        if (author) {
          authors.add(author);
        }

        if (date) {
          const m = typeof date === 'string' ? date.match(/(\d{4})/) : null;
          const dateKey = m ? m[1] : (date ? String(date) : 'Unknown');
          dates.add(dateKey);
        }

        if (type) {
          types.add(type);
        }
      }

      const sortedAuthors = Array.from(authors).sort();
      const sortedDates = Array.from(dates).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      const sortedTypes = Array.from(types).sort();

      setAllAuthors(sortedAuthors);
      setAllDates(sortedDates);
      setAllTypes(sortedTypes);

      // ✅ Salva no cache para próximas carregações
      setCachedFilters(sortedAuthors, sortedDates, sortedTypes);
      console.log('Filtros atualizados e salvos em cache');

    } catch (error) {
      console.error("Failed to fetch filters from server:", error);
    } finally {
      setLoadingFilters(false);
    }
  }

  /**
   * Atualiza os filtros em background sem bloquear a UI
   */
  function updateFiltersInBackground() {
    // Executa em background (não bloqueia a UI)
    setTimeout(() => {
      console.log('Atualizando filtros em background...');
      fetchFiltersFromServer().catch((error) => {
        console.warn('Erro ao atualizar filtros em background:', error);
      });
    }, 2000); // Aguarda 2 segundos antes de atualizar
  }

  async function fetchItems(currentPage: number, signal?: AbortSignal) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        collection: COLLECTION_ID.toString(),
        page: currentPage.toString(),
        paged: currentPage.toString(),
        order: 'ASC',
        orderby: 'date',
        perpage: '24',
        fetch_only: 'thumbnail',
      });

      const searchTerms = [...selectedAuthors, ...selectedDates, ...selectedTypes].join(' ');
      if (searchTerms) {
        params.append('search', searchTerms);
      }
      
      const response = await fetch(`/api/tainacan/items?${params.toString()}`, { signal });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const basicItems = data.items || [];
      
      // ✅ Otimização: Usar apenas dados disponíveis sem fazer 24 requisições extras
      const transformedItems: Item[] = basicItems.map((apiItem: ApiItem) => {
        const metadata = (apiItem.metadata || {}) as Record<string, { value?: unknown }>;
        const author = (metadata['taxonomia']?.value as Array<{ name: string }>)?.[0]?.name || '';
        const title = (metadata['titulo-6']?.value as string) || apiItem.title?.rendered || 'Sem Título';
        const date = (metadata['data-da-obra-2']?.value as string) || '';
        const type = (metadata['tecnica-3']?.value as { name: string })?.name || '';
        
        let imageUrl = '';
        if (apiItem.thumbnail && apiItem.thumbnail['tainacan-medium']) {
          imageUrl = apiItem.thumbnail['tainacan-medium'][0];
        } 
        else if (apiItem.document_as_html) {
          const match = apiItem.document_as_html.match(/src="([^"]+)"/);
          if (match) {
            imageUrl = match[1];
          }
        }
        
        return {
          id: apiItem.id,
          title,
          description: apiItem.description || '',
          _thumbnail_id: apiItem._thumbnail_id,
          imageUrl,
          author,
          date,
          type,
        } as Item;
      });
      
      setItems(transformedItems);

      // Lógica de paginação mais robusta
      const perPage = 24;
      const totalPagesHeader = response.headers.get('x-wp-totalpages');
      const parsedTotalPages = totalPagesHeader ? parseInt(totalPagesHeader, 10) : undefined;
      setTotalPages(parsedTotalPages ?? currentPage);

      const hasNext = typeof parsedTotalPages === 'number'
        ? currentPage < parsedTotalPages
        : transformedItems.length === perPage;

      setHasNextPage(hasNext);
      setHasPrevPage(currentPage > 1);

    } catch (e) {
      console.error('Error fetching items:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="gallery-layout">
      <FilterSidebar
        authors={allAuthors}
        dates={allDates}
        types={allTypes}
        selectedAuthors={selectedAuthors}
        selectedDates={selectedDates}
        selectedTypes={selectedTypes}
        onAuthorChange={handleAuthorChange}
        onDateChange={handleDateChange}
        onTypeChange={handleTypeChange}
        isLoading={loadingFilters}
      />
      <div className="gallery-container">
        <div className="gallery-content">
          {/* Top pagination controls: First, Prev, pages (current-2..current+2), Next, Last */}
          <div className="top-pagination" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => setPage(1)}
              disabled={page === 1 || loading}
              className="page-button"
            >
              Primeira
            </button>

            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={!hasPrevPage || loading}
              className="page-button"
            >
              ← Voltar
            </button>

            {/* Render pages current-2 .. current+2 */}
            {Array.from({ length: 5 }).map((_, idx) => {
              const pageNumber = page - 2 + idx; // idx 0 -> page-2, idx 4 -> page+2
              if (pageNumber < 1 || pageNumber > totalPages) return null;
              const isCurrent = pageNumber === page;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  disabled={loading}
                  className="page-button"
                  style={isCurrent ? { fontWeight: '700', background: '#eee' } : undefined}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={!hasNextPage || loading}
              className="page-button"
            >
              Próxima →
            </button>

            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages || loading}
              className="page-button"
            >
              Última
            </button>

            <div style={{ marginLeft: 'auto', fontSize: 14 }}>
              Página {page} de {totalPages}
            </div>
          </div>

          <h1 className="gallery-title">Galeria de Arte Tainacan</h1>

          {/* Rótulo orientando o usuário sobre a seleção para a Galeria 3D */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <div style={{ color: '#444', fontSize: 14, fontWeight: 500 }}>
              Selecione as obras que irão a Galeria 3D:
            </div>
          </div>

          {/* Visual save button (executa saveSelection) */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <button
              className="page-button"
              style={{ background: '#28a745', marginRight: 8 }}
              onClick={(e) => { e.preventDefault(); saveSelection(); }}
            >
              Salvar Seleção ({selectedItemsData.length})
            </button>
            <button
              className="page-button"
              style={{ background: selectedItemsData.length === 0 ? '#ccc' : '#dc3545' }}
              onClick={(e) => {
                e.preventDefault();
                // Clear selection visually
                setSelectedIds(new Set());
                setSelectedItemsData([]);
                localStorage.removeItem('gallerySelectedItemsData');
              }}
              disabled={selectedItemsData.length === 0}
              title="Limpar seleção"
            >
              Limpar Seleção
            </button>
          </div>

          {totalPages > 1 && (
            <p className="gallery-info">
              Página {page} de {totalPages} • 24 imagens por página
            </p>
          )}

          {loading && page === 1 ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Carregando itens...</p>
            </div>
          ) : (
            <>
              <div className="gallery-grid">
                {items.map((item) => (
                  <ImageCard
                    key={item.id}
                    item={item}
                    selectable={true}
                    isSelected={selectedIds.has(item.id)}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </div>

              {items.length === 0 && !loading && (
                <div className="no-items">
                  <h3>Nenhuma imagem encontrada</h3>
                  <p>Tente ajustar os filtros ou navegue para outra página.</p>
                </div>
              )}
            </>
          )}

          {/* Bottom pagination with same layout as top */}
          <div className="pagination" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 18, flexWrap: 'wrap' }}>
            <button
              onClick={() => setPage(1)}
              disabled={page === 1 || loading}
              className="page-button"
            >
              Primeira
            </button>

            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={!hasPrevPage || loading}
              className="page-button"
            >
              ← Voltar
            </button>

            {Array.from({ length: 5 }).map((_, idx) => {
              const pageNumber = page - 2 + idx;
              if (pageNumber < 1 || pageNumber > totalPages) return null;
              const isCurrent = pageNumber === page;
              return (
                <button
                  key={`bottom-${pageNumber}`}
                  onClick={() => setPage(pageNumber)}
                  disabled={loading}
                  className="page-button"
                  style={isCurrent ? { fontWeight: '700', background: '#eee' } : undefined}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={!hasNextPage || loading}
              className="page-button"
            >
              Próxima →
            </button>

            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages || loading}
              className="page-button"
            >
              Última
            </button>

            <div style={{ marginLeft: 'auto', fontSize: 14 }}>
              Página {page} de {totalPages}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gallery;
