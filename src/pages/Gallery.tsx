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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('https://tainacan.ufsm.br/acervo-artistico/wp-json/tainacan/v2/collection/2174/items');
        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }
        const data = await response.json();
        setItems(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const extractImageSrc = (html: string): string | null => {
    const match = html.match(/src="([^"]+)"/);
    return match ? match[1] : null;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Acervo Artístico da UFSM</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {items.map((item) => {
          const imageSrc = extractImageSrc(item.document_as_html);
          const title = item.metadata['titulo-6']?.value || item.title;
          const author = item.metadata.taxonomia?.value?.[0]?.name || 'Unknown';
          const date = item.metadata['data-da-obra-2']?.value || 'Unknown';
          const technique = item.metadata.tecnica?.value?.name || 'Unknown';

          return (
            <div key={item.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
              {imageSrc && (
                <img
                  src={imageSrc}
                  alt={title}
                  style={{ width: '100%', height: 'auto', maxHeight: '200px', objectFit: 'cover' }}
                />
              )}
              <h3>{title}</h3>
              <p><strong>Author:</strong> {author}</p>
              <p><strong>Date:</strong> {date}</p>
              <p><strong>Technique:</strong> {technique}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Gallery;