import React, { useEffect, useState } from "react";
import ImageCard from "../components/ImageCard";
import FilterSidebar from "../components/FilterSidebar";
import "./Gallery.css";

type Item = {
  id: number;
  title: string;
  description: string;
  _thumbnail_id?: string;
  imageUrl?: string;
  author?: string;
  date?: string;
  type?: string;
};

const COLLECTION_ID = 2174;

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

  // Efeito para buscar as opções de filtro na montagem do componente
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Efeito unificado para buscar itens sempre que a página ou os filtros mudarem
  useEffect(() => {
    fetchItems(page);
  }, [page, selectedAuthors, selectedDates, selectedTypes]);

  // Efeito para resetar a página quando os filtros são alterados
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [selectedAuthors, selectedDates, selectedTypes]);

  const handleAuthorChange = (author: string) => {
    setSelectedAuthors(prev => 
      prev.includes(author) ? prev.filter(a => a !== author) : [...prev, author]
    );
  };

  const handleDateChange = (date: string) => {
    setSelectedDates(prev =>
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    );
  };

  const handleTypeChange = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  async function fetchFilterOptions() {
    setLoadingFilters(true);
    try {
      // Busca as primeiras 2 páginas (até 200 itens) para gerar filtros rapidamente.
      const page1Promise = fetch(`/api/tainacan/items?collection=${COLLECTION_ID}&perpage=100&page=1`).then(res => res.json());
      const page2Promise = fetch(`/api/tainacan/items?collection=${COLLECTION_ID}&perpage=100&page=2`).then(res => res.json());

      const [page1Data, page2Data] = await Promise.all([page1Promise, page2Promise]);

      const itemsFromApi = [...(page1Data.items || []), ...(page2Data.items || [])];

      const authors = new Set<string>();
      const dates = new Set<string>();
      const types = new Set<string>();

      for (const item of itemsFromApi) {
        const metadata = item.metadata || {};
        if (metadata['taxonomia']?.value?.[0]?.name) {
          authors.add(metadata['taxonomia'].value[0].name);
        }
        if (metadata['data-da-obra-2']?.value) {
          dates.add(metadata['data-da-obra-2'].value);
        }
        if (metadata['tecnica-3']?.value?.name) {
          types.add(metadata['tecnica-3'].value.name);
        }
      }

      setAllAuthors(Array.from(authors).sort());
      setAllDates(Array.from(dates).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })));
      setAllTypes(Array.from(types).sort());

    } catch (error) {
      console.error("Failed to fetch filter options from item list:", error);
      // Em caso de falha, a lista de filtros ficará vazia, mas a galeria principal ainda funciona.
    } finally {
      setLoadingFilters(false);
    }
  }

  async function fetchItems(currentPage: number) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        collection: COLLECTION_ID.toString(),
        page: currentPage.toString(),
        perpage: '24',
      });

      const searchTerms = [...selectedAuthors, ...selectedDates, ...selectedTypes].join(' ');
      if (searchTerms) {
        params.append('search', searchTerms);
      }
      
      const response = await fetch(`/api/tainacan/items?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const transformedItems: Item[] = data.items.map((apiItem: any) => {
        const metadata = apiItem.metadata || {};
        let author = metadata['taxonomia']?.value?.[0]?.name || '';
        let title = metadata['titulo-6']?.value || apiItem.title?.rendered || 'Sem Título';
        let date = metadata['data-da-obra-2']?.value || '';
        let type = metadata['tecnica-3']?.value?.name || '';
        
        let imageUrl = '';
        if (apiItem.thumbnail && apiItem.thumbnail['tainacan-medium']) {
          imageUrl = apiItem.thumbnail['tainacan-medium'];
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
          type 
        };
      });
      
      // Sempre substitui os itens com os da página atual
      setItems(transformedItems);
      
      // Lógica de paginação mais robusta
      const perPage = 24;
      const totalPagesHeader = response.headers.get('x-wp-totalpages');

      if (totalPagesHeader) {
        setTotalPages(parseInt(totalPagesHeader, 10));
      } else {
        // Se o header não vier, estima o total de páginas
        setTotalPages(currentPage); // Mostra pelo menos a página atual
      }

      setHasNextPage(transformedItems.length === perPage);
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
        isLoading={loadingFilters} // Passa o estado de carregamento para a sidebar
      />
      <div className="gallery-container">
        <div className="gallery-content">
          <h1 className="gallery-title">Galeria de Arte Tainacan</h1>

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
                  <ImageCard key={item.id} item={item} />
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

          <div className="pagination">
            <button
              onClick={() => { if (page > 1) setPage(page - 1); }}
              disabled={!hasPrevPage || loading}
              className="page-button"
            >
              ← Anterior
            </button>

            <div className="page-info">
              Página {page} de {totalPages}
            </div>

            <button
              onClick={() => { if (hasNextPage) setPage(page + 1); }}
              disabled={!hasNextPage || loading}
              className="page-button"
            >
              Próxima →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gallery;
