import React, { useEffect, useState } from "react";
import ImageCard from "../components/ImageCard";

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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          textAlign: 'center',
          color: '#333',
          fontSize: '2.5rem',
          marginBottom: '10px',
          fontWeight: '300',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          Galeria de Arte Tainacan
        </h1>

        {totalPages > 1 && (
          <p style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '1rem',
            marginBottom: '30px',
            fontWeight: '400'
          }}>
            {isInitialLoad ? 'Analisando coleção...' : `Página ${page} de ${totalPages} • 36 imagens por página`}
          </p>
        )}

        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '300px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <p style={{ marginTop: '20px', color: '#666' }}>
              {isInitialLoad ? 'Descobrindo total de páginas...' : 'Carregando itens...'}
            </p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '15px',
              marginBottom: '40px'
            }}>
              {items.map((item) => (
                <ImageCard key={item.id} item={item} />
              ))}
            </div>

            {items.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#666'
              }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
                  Nenhuma imagem encontrada
                </h3>
                <p>Tente recarregar a página ou navegue para outra página.</p>
              </div>
            )}
          </>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          marginTop: '40px'
        }}>
          <button
            onClick={() => {
              const newPage = Math.max(1, page - 1);
              console.log(`Navigating from page ${page} to ${newPage}`);
              setPage(newPage);
            }}
            disabled={!hasPrevPage || loading}
            style={{
              padding: '12px 24px',
              background: !hasPrevPage || loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: !hasPrevPage || loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}
          >
            ← Anterior
          </button>

          <div style={{
            background: 'white',
            padding: '12px 20px',
            borderRadius: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            fontWeight: '500',
            color: '#333'
          }}>
            Página {page} de {totalPages}
          </div>

          <button
            onClick={() => {
              const newPage = page + 1;
              console.log(`Navigating from page ${page} to ${newPage}`);
              setPage(newPage);
            }}
            disabled={!hasNextPage || loading}
            style={{
              padding: '12px 24px',
              background: !hasNextPage || loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: !hasNextPage || loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}
          >
            Próxima →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Gallery;
