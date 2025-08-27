import React, { useState, useEffect } from 'react';

interface Item {
  id: number;
  title: string;
  document_as_html: string;
  metadata: {
    'titulo-6': { value: string };
    taxonomia: { value: Array<{ name: string }> };
    'data-da-obra-2': { value: string };
    tecnica: { value: { name: string } };
  };
}

const Gallery: React.FC = () => {

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const perPage = 12;

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://tainacan.ufsm.br/acervo-artistico/wp-json/tainacan/v2/collection/2174/items?perpage=${perPage}&paged=${page}`);
        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          setItems(prev => page === 0 ? data.items : [...prev, ...data.items]);
          setHasMore(data.items.length === perPage);
        } else {
          setHasMore(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [page]);


  // Tenta extrair a imagem do HTML, ou monta a URL pelo _thumbnail_id
  const extractImageSrc = (item: Item): string | null => {
    // 1. Tenta extrair do document_as_html
    if (item.document_as_html) {
      const match = item.document_as_html.match(/src="([^"]+)"/);
      if (match) return match[1];
    }
    // 2. Tenta usar _thumbnail_id se existir
    // O padrão de URL do Tainacan para thumbnails:
    // https://tainacan.ufsm.br/acervo-artistico/wp-content/uploads/sites/5/tainacan-items/2174/{item.id}/{item._thumbnail_id}.jpg
    // O campo _thumbnail_id pode ser undefined/null
    // O tipo Item precisa ser ajustado para incluir _thumbnail_id
    if ((item as any)._thumbnail_id) {
      return `https://tainacan.ufsm.br/acervo-artistico/wp-content/uploads/sites/5/tainacan-items/2174/${item.id}/${(item as any)._thumbnail_id}.jpg`;
    }
    return null;
  };


  if (error) {
    return <div style={{ padding: '20px' }}>Erro: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Acervo Artístico da UFSM</h1>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '16px',
        alignItems: 'start',
      }}>
        {items.map((item) => {
          const imageSrc = extractImageSrc(item);
          const title = item.metadata['titulo-6']?.value || item.title;
          const author = item.metadata.taxonomia?.value?.[0]?.name || 'Desconhecido';
          const date = item.metadata['data-da-obra-2']?.value || 'Desconhecido';
          const technique = item.metadata.tecnica?.value?.name || 'Desconhecido';

          return (
            <div key={item.id} style={{ border: '1px solid #e0e0e0', padding: '10px', borderRadius: '8px', background: '#fafafa', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={title}
                  style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '4px', background: '#eee' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div style={{ width: '100%', height: '180px', background: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
                  <span>Sem imagem</span>
                </div>
              )}
              <h3 style={{ fontSize: '1.1em', margin: '10px 0 4px' }}>{title}</h3>
              <p style={{ margin: '2px 0', fontSize: '0.95em' }}><strong>Autor:</strong> {author}</p>
              <p style={{ margin: '2px 0', fontSize: '0.95em' }}><strong>Data:</strong> {date}</p>
              <p style={{ margin: '2px 0', fontSize: '0.95em' }}><strong>Técnica:</strong> {technique}</p>
            </div>
          );
        })}
      </div>
      {hasMore && (
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
            style={{
              padding: '10px 24px',
              fontSize: '1em',
              borderRadius: '6px',
              border: 'none',
              background: '#1976d2',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              marginTop: '10px',
            }}
          >{loading ? 'Carregando...' : 'Carregar mais'}</button>
        </div>
      )}
      {!hasMore && items.length > 0 && (
        <div style={{ textAlign: 'center', margin: '30px 0', color: '#888' }}>
          <span>Todos os itens carregados.</span>
        </div>
      )}
    </div>
  );
};

export default Gallery;