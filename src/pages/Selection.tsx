import React, { useEffect, useState } from "react";

type Attachment = {
  id: number;
  title: string;
  description: string;
  mime_type: string;
  url: string;
  media_type: string;
  alt_text?: string;
};

type Item = {
  id: number;
  title: string;
  description: string;
  _thumbnail_id?: string;
  attachments: Attachment[];
};

const COLLECTION_ID = 2174;
const API_BASE = "https://tainacan.ufsm.br/acervo-artistico/wp-json/tainacan/v2";

const Selection: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchItems();
  }, [page]);

  async function findTotalPages(): Promise<number> {
    console.log('Finding total pages...');

    // Estratégia otimizada: começar com páginas menores e aumentar
    const testPages = [10, 25, 50, 100, 200, 500]; // Páginas para testar em ordem crescente
    let lastValidPage = 1;

    for (const testPage of testPages) {
      try {
        console.log(`Testing page ${testPage}...`);
        const res = await fetch(
          `${API_BASE}/collection/${COLLECTION_ID}/items?perpage=1&paged=${testPage}`
        );
        const data = await res.json();

        if (data.items && data.items.length > 0) {
          lastValidPage = testPage;
          console.log(`Page ${testPage} has items, continuing...`);
        } else {
          console.log(`Page ${testPage} is empty, found boundary`);
          break;
        }
      } catch (e) {
        console.log(`Error testing page ${testPage}, using last valid page`);
        break;
      }
    }

    // Busca binária nas proximidades para precisão
    let low = Math.max(1, lastValidPage - 10);
    let high = lastValidPage + 20;
    let finalTotalPages = lastValidPage;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      try {
        const res = await fetch(
          `${API_BASE}/collection/${COLLECTION_ID}/items?perpage=1&paged=${mid}`
        );
        const data = await res.json();

        if (data.items && data.items.length > 0) {
          finalTotalPages = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      } catch (e) {
        high = mid - 1;
      }
    }

    console.log(`Total pages found: ${finalTotalPages}`);
    return finalTotalPages;
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

      // Se não há items nesta página, significa que chegamos ao fim
      if (!data.items || data.items.length === 0) {
        console.log(`No items found on page ${page} - reached end of collection`);
        if (page > 1) {
          // Se estamos em uma página > 1 e não há items, voltamos para a página anterior
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

      // Se chegamos aqui, há items nesta página
      const itemsWithAttachments: Item[] = await Promise.all(
        data.items.map(async (item: any) => {
          let attachments: Attachment[] = [];
          try {
            const attRes = await fetch(`${API_BASE}/items/${item.id}/attachments`);
            const attData = await attRes.json();
            attachments = attData as Attachment[];
          } catch (e) {
            console.warn(`Failed to fetch attachments for item ${item.id}:`, e);
            attachments = [];
          }
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            _thumbnail_id: item._thumbnail_id,
            attachments,
          };
        })
      );

      console.log(`Successfully loaded ${itemsWithAttachments.length} items for page ${page}`);

      // Na primeira carga, descobrir o total de páginas
      if (isInitialLoad) {
        console.log('Initial load - finding total pages...');
        const totalPagesFound = await findTotalPages();
        setTotalPages(totalPagesFound);
        setIsInitialLoad(false);
        console.log(`✅ Set total pages to: ${totalPagesFound}`);
      }

      // Verificar se há próxima página tentando carregar a próxima
      const nextPageRes = await fetch(
        `${API_BASE}/collection/${COLLECTION_ID}/items?perpage=1&paged=${page + 1}`
      );
      const nextPageData = await nextPageRes.json();
      const hasNext = !!(nextPageData.items && nextPageData.items.length > 0);

      setItems(itemsWithAttachments);
      setHasNextPage(hasNext);
      setHasPrevPage(page > 1);

      // Só estimar total de páginas se ainda não foi descoberto na carga inicial
      if (isInitialLoad) {
        // Na carga inicial, já descobrimos o total correto acima
        console.log(`Initial load complete - totalPages already set to: ${totalPages}`);
      } else {
        // Para navegações subsequentes, manter a estimação simples mas não sobrescrever valores altos
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

  function getImageAttachments(item: Item): Attachment[] {
    return item.attachments.filter(att => att.media_type === "image" && att.url);
  }

  function toggleSelection(itemId: number) {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }

  function saveSelection() {
    // Pega os objetos completos das obras selecionadas
    const selectedData = items
      .filter(item => selectedItems.has(item.id))
      .map(item => {
        const imageAttachments = getImageAttachments(item);
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          // pega só a primeira imagem para simplificar
          imageUrl: imageAttachments.length > 0 ? imageAttachments[0].url : null
        };
      });

    // Salva no localStorage como string JSON
    localStorage.setItem("selectedArtworks", JSON.stringify(selectedData));

    console.log("Selecionados salvos no localStorage:", selectedData);
    alert(`Seleção salva! ${selectedData.length} obras armazenadas.`);
  }

  function removeSelection() {
    setSelectedItems(new Set());
    alert('Seleção removida.');
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
          Seleção de Obras
        </h1>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <button
            onClick={saveSelection}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
            }}
          >
            Salvar Seleção ({selectedItems.size})
          </button>
          <button
            onClick={removeSelection}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(244, 67, 54, 0.3)'
            }}
          >
            Remover Seleção
          </button>
        </div>

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
              {isInitialLoad ? 'Descobrindo total de páginas...' : 'Carregando imagens...'}
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
              {items.map((item) => {
                const imageAttachments = getImageAttachments(item);
                const isSelected = selectedItems.has(item.id);
                return imageAttachments.map((attachment) => (
                  <div
                    key={`${item.id}-${attachment.id}`}
                    style={{
                      background: isSelected ? 'rgba(102, 126, 234, 0.1)' : 'white',
                      borderRadius: '15px',
                      overflow: 'hidden',
                      boxShadow: isSelected ? '0 8px 25px rgba(102, 126, 234, 0.3)' : '0 8px 25px rgba(0,0,0,0.1)',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #667eea' : 'none'
                    }}
                    onClick={() => toggleSelection(item.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = isSelected ? '0 8px 25px rgba(102, 126, 234, 0.3)' : '0 8px 25px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div style={{
                      position: 'relative',
                      overflow: 'hidden',
                      height: '180px'
                    }}>
                      <img
                        src={attachment.url}
                        alt={attachment.alt_text || attachment.title || 'Imagem da galeria'}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      />
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: '#667eea',
                          color: 'white',
                          borderRadius: '50%',
                          width: '30px',
                          height: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: 'bold'
                        }}>
                          ✓
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '15px' }}>
                      <h3 style={{
                        margin: '0',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#333',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textAlign: 'center'
                      }}>
                        {item.title || `Imagem ${item.id}`}
                      </h3>
                    </div>
                  </div>
                ));
              })}
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

export default Selection;
