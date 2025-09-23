import React, { useEffect, useState } from "react";
import ImageCard from "../components/ImageCard";
import "./Gallery.css";

type Item = {
  id: number;
  title: string;
  description: string;
  _thumbnail_id?: string;
};

const COLLECTION_ID = 2174;
const API_BASE = "https://tainacan.ufsm.br/acervo-artistico/wp-json/tainacan/v2";

const Gallery: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [page]);

  async function findTotalPages(): Promise<number> {
    try {
      const res = await fetch(`${API_BASE}/collections/${COLLECTION_ID}`);
      const data = await res.json();
      const totalItems = parseInt(data.total_items?.publish || "0", 10);
      const perPage = 36;
      const totalPages = Math.ceil(totalItems / perPage);
      return totalPages;
    } catch (e) {
      console.error('Error fetching total items from collection:', e);
      return 1;
    }
  }

  async function fetchItems() {
    setLoading(true);
    try {
      console.log(`Fetching page ${page}`);

      const res = await fetch(
        `${API_BASE}/collection/${COLLECTION_ID}/items?perpage=36&paged=${page}`
      );
      const data = await res.json();

      console.log(`Page ${page} response:`, {
        itemsCount: data.items?.length || 0,
        hasItems: !!(data.items && data.items.length > 0)
      });

      if (!data.items || data.items.length === 0) {
        console.log(`No items found on page ${page} - reached end of collection`);
        if (page > 1) {
          setPage(page - 1);
          return;
        }
        setItems([]);
        setTotalPages(1);
        setHasNextPage(false);
        setHasPrevPage(false);
        setLoading(false);
        return;
      }

      const newItems: Item[] = data.items.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        _thumbnail_id: item._thumbnail_id,
      }));

      console.log(`Successfully loaded ${newItems.length} item stubs for page ${page}`);

      if (isInitialLoad) {
        console.log('Initial load - finding total pages...');
        const totalPagesFound = await findTotalPages();
        setTotalPages(totalPagesFound);
        setIsInitialLoad(false);
        console.log(`✅ Set total pages to: ${totalPagesFound}`);
      }

      const nextPageRes = await fetch(
        `${API_BASE}/collection/${COLLECTION_ID}/items?perpage=1&paged=${page + 1}`
      );
      const nextPageData = await nextPageRes.json();
      const hasNext = !!(nextPageData.items && nextPageData.items.length > 0);

      setItems(newItems);
      setHasNextPage(hasNext);
      setHasPrevPage(page > 1);

      if (!isInitialLoad) {
        const newEstimatedTotal = hasNext ? Math.max(totalPages, page + 1) : Math.max(totalPages, page);
        if (newEstimatedTotal !== totalPages) {
          console.log(`Updating totalPages from ${totalPages} to ${newEstimatedTotal}`);
          setTotalPages(newEstimatedTotal);
        }
      }

      console.log(`📄 Final state - Page: ${page}, Total: ${totalPages}, HasNext: ${hasNext}, HasPrev: ${page > 1}`);

    } catch (e) {
      console.error('Error fetching items:', e);
      setItems([]);
    }
    setLoading(false);
  }

  return (
    <div className="gallery-container">
      <div className="gallery-content">
        <h1 className="gallery-title">
          Galeria de Arte Tainacan
        </h1>

        {totalPages > 1 && (
          <p className="gallery-info">
            {isInitialLoad ? 'Analisando coleção...' : `Página ${page} de ${totalPages} • 36 imagens por página`}
          </p>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">
              {isInitialLoad ? 'Descobrindo total de páginas...' : 'Carregando itens...'}
            </p>
          </div>
        ) : (
          <>
            <div className="gallery-grid">
              {items.map((item) => (
                <ImageCard key={item.id} item={item} />
              ))}
            </div>

            {items.length === 0 && (
              <div className="no-items">
                <h3>
                  Nenhuma imagem encontrada
                </h3>
                <p>Tente recarregar a página ou navegue para outra página.</p>
              </div>
            )}
          </>
        )}

        <div className="pagination">
          <button
            onClick={() => {
              const newPage = Math.max(1, page - 1);
              console.log(`Navigating from page ${page} to ${newPage}`);
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
              console.log(`Navigating from page ${page} to ${newPage}`);
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
