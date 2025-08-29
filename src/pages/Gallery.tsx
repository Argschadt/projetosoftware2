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

const Gallery: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchItems();
  }, [page]);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/collection/${COLLECTION_ID}/items?perpage=20&paged=${page}`
      );
      const data = await res.json();
      setTotalPages(data.total_pages || 1);
      const itemsWithAttachments: Item[] = await Promise.all(
        data.items.map(async (item: any) => {
          let attachments: Attachment[] = [];
          try {
            const attRes = await fetch(`${API_BASE}/items/${item.id}/attachments`);
            const attData = await attRes.json();
            attachments = attData as Attachment[];
          } catch (e) {
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
      setItems(itemsWithAttachments);
    } catch (e) {
      setItems([]);
    }
    setLoading(false);
  }

  function getImageAttachments(item: Item): Attachment[] {
    return item.attachments.filter(att => att.media_type === "image" && att.url);
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
          marginBottom: '30px',
          fontWeight: '300',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          Galeria de Arte Tainacan
        </h1>

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
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '40px'
            }}>
              {items.map((item) => {
                const imageAttachments = getImageAttachments(item);
                return imageAttachments.map((attachment) => (
                  <div
                    key={`${item.id}-${attachment.id}`}
                    style={{
                      background: 'white',
                      borderRadius: '15px',
                      overflow: 'hidden',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div style={{
                      position: 'relative',
                      overflow: 'hidden',
                      height: '250px'
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            style={{
              padding: '12px 24px',
              background: page === 1 || loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: page === 1 || loading ? 'not-allowed' : 'pointer',
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
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            style={{
              padding: '12px 24px',
              background: page === totalPages || loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: page === totalPages || loading ? 'not-allowed' : 'pointer',
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