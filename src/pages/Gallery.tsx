import React, { useEffect, useState } from "react";
import ImageCard from "../components/ImageCard";
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [authorFilter, setAuthorFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filteredItems = items.filter(item => {
    const searchTerm = authorFilter.toLowerCase(); // Usando o campo de autor como busca geral
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm) || 
      item.description.toLowerCase().includes(searchTerm) ||
      (item.author && item.author.toLowerCase().includes(searchTerm));
    
    const matchesDate = !dateFilter || 
      item.description.toLowerCase().includes(dateFilter.toLowerCase()) ||
      (item.date && item.date.includes(dateFilter));
    
    const matchesType = !typeFilter || 
      item.description.toLowerCase().includes(typeFilter.toLowerCase()) ||
      (item.type && item.type.toLowerCase() === typeFilter.toLowerCase());
    
    return matchesSearch && matchesDate && matchesType;
  });

  useEffect(() => {
    fetchItems();
  }, [page]);

  async function fetchItems() {
    console.log('fetchItems called with page:', page);
    setLoading(true);
    try {
      console.log(`Fetching page ${page}`);
      
      // Fetch real items from Tainacan API
      const response = await fetch(`/api/tainacan/items?collection=${COLLECTION_ID}&page=${page}&perpage=36`);
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      console.log('Number of items received:', data.items?.length || 0);
      
      // Transform API data to our Item format
      const transformedItems: Item[] = data.items.map((apiItem: any) => {
        console.log('Processing item:', apiItem.id, apiItem.title);
        
        // Extract metadata from the API response
        const metadata = apiItem.metadata || {};
        
        // Extract author from taxonomia field
        let author = '';
        if (metadata['taxonomia'] && metadata['taxonomia'].value) {
          const authorData = Array.isArray(metadata['taxonomia'].value) 
            ? metadata['taxonomia'].value[0] 
            : metadata['taxonomia'].value;
          author = authorData?.name || '';
        }
        
        // Extract title
        let title = apiItem.title?.rendered || apiItem.title || 'Sem Título';
        if (metadata['titulo-6'] && metadata['titulo-6'].value) {
          title = metadata['titulo-6'].value;
        }
        
        // Extract date
        let date = '';
        if (metadata['data-da-obra-2'] && metadata['data-da-obra-2'].value) {
          date = metadata['data-da-obra-2'].value;
        }
        
        // Extract type from tecnica field
        let type = '';
        if (metadata['tecnica-3'] && metadata['tecnica-3'].value) {
          const typeData = metadata['tecnica-3'].value;
          type = typeData?.name || '';
        }
        
        // Extract image URL from document_as_html
        let imageUrl = '';
        if (apiItem.document_as_html) {
          const imgMatch = apiItem.document_as_html.match(/src="([^"]+)"/);
          if (imgMatch) {
            imageUrl = imgMatch[1];
          }
        }
        
        const transformedItem = {
          id: apiItem.id,
          title: title,
          description: apiItem.description || '',
          _thumbnail_id: apiItem._thumbnail_id,
          imageUrl: imageUrl,
          author: author,
          date: date,
          type: type
        };
        
        console.log('Transformed item:', transformedItem);
        return transformedItem;
      });
      
      console.log('Total transformed items:', transformedItems.length);
      
      setItems(transformedItems);
      
      // Calculate pagination
      const totalItems = data.total || data.found || 0;
      const perPage = 36;
      const calculatedTotalPages = Math.ceil(totalItems / perPage);
      
      setTotalPages(calculatedTotalPages);
      setHasNextPage(page < calculatedTotalPages);
      setHasPrevPage(page > 1);
      
      console.log(`Loaded ${transformedItems.length} items, total pages: ${calculatedTotalPages}`);
      console.log('Setting items in state:', transformedItems);

    } catch (e) {
      console.error('Error fetching items:', e);
      setItems([]);
      setTotalPages(1);
      setHasNextPage(false);
      setHasPrevPage(false);
    }
    setLoading(false);
    console.log('Loading set to false');
  }

  return (
    <div className="gallery-container">
      <div className="gallery-content">
        <h1 className="gallery-title">
          Galeria de Arte Tainacan
        </h1>

        <div className="filters">
          <input
            type="text"
            placeholder="Buscar por autor, título ou descrição"
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            className="filter-input"
          />
          <input
            type="text"
            placeholder="Buscar por data/ano"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-input"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Buscar por tipo</option>
            <option value="Desenho">Desenho</option>
            <option value="Escultura">Escultura</option>
            <option value="Gravura">Gravura</option>
            <option value="Pintura">Pintura</option>
            <option value="Fotografia">Fotografia</option>
            <option value="Instalação">Instalação</option>
            <option value="Vídeo">Vídeo</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        {totalPages > 1 && (
          <p className="gallery-info">
            Página {page} de {totalPages} • 36 imagens por página
          </p>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">
              Carregando itens...
            </p>
          </div>
        ) : (
          <>
            <div className="gallery-grid">
              {filteredItems.map((item) => (
                <ImageCard key={item.id} item={item} />
              ))}
            </div>

            {filteredItems.length === 0 && items.length > 0 && (
              <div className="no-items">
                <h3>
                  Nenhuma imagem encontrada
                </h3>
                <p>Tente ajustar os filtros ou navegue para outra página.</p>
              </div>
            )}
          </>
        )}

        <div className="pagination">
          <button
            onClick={() => {
              const newPage = Math.max(1, page - 1);
              setPage(newPage);
            }}
            disabled={!hasPrevPage || loading}
            className="page-button"
          >
            ← Anterior
          </button>

          <div className="page-info">
            Página {page} de {totalPages}
          </div>

          <button
            onClick={() => {
              const newPage = page + 1;
              setPage(newPage);
            }}
            disabled={!hasNextPage || loading}
            className="page-button"
          >
            Próxima →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Gallery;
