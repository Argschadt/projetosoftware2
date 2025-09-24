import React, { useState, useEffect } from 'react';
import './ImageCard.css';

const API_BASE = "https://tainacan.ufsm.br/acervo-artistico/wp-json/tainacan/v2";

type Item = {
  id: number;
  title: string;
  imageUrl?: string;
};

interface ImageCardProps {
  item: Item;
}

const ImageCard: React.FC<ImageCardProps> = ({ item }) => {
  const [finalImageUrl, setFinalImageUrl] = useState<string | undefined>(item.imageUrl);
  const [isLoading, setIsLoading] = useState<boolean>(!item.imageUrl);

  useEffect(() => {
    // Se a URL já veio, usa ela.
    if (item.imageUrl) {
      setFinalImageUrl(item.imageUrl);
      setIsLoading(false);
    } else {
      // Se não, como último recurso, busca os anexos.
      setIsLoading(true);
      fetch(`${API_BASE}/items/${item.id}/attachments?perpage=1`)
        .then(res => res.json())
        .then(attachments => {
          const imageAttachment = attachments.find((att: any) => att.media_type === 'image' && att.url);
          if (imageAttachment) {
            setFinalImageUrl(imageAttachment.url);
          }
        })
        .catch(error => console.error(`Failed to fetch fallback attachments for item ${item.id}`, error))
        .finally(() => setIsLoading(false));
    }
  }, [item.id, item.imageUrl]);

  return (
    <div className="image-card">
      <div className="image-container">
        {isLoading ? (
          <div className="card-spinner"></div>
        ) : finalImageUrl ? (
          <img
            src={finalImageUrl}
            alt={item.title || `Imagem da obra ${item.id}`}
            className="card-image"
            loading="lazy"
          />
        ) : (
          <div className="no-image-placeholder">
            <span className="no-image-text">Sem imagem</span>
          </div>
        )}
      </div>
      <div className="card-content">
        <h3 className="card-title">
          {item.title || `Item ${item.id}`}
        </h3>
      </div>
    </div>
  );
};

export default ImageCard;
