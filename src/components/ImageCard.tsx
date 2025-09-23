import React, { useState, useEffect, useRef } from 'react';
import './ImageCard.css';

const API_BASE = "https://tainacan.ufsm.br/acervo-artistico/wp-json/tainacan/v2";

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
};

interface ImageCardProps {
  item: Item;
}

const ImageCard: React.FC<ImageCardProps> = ({ item }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchAttachments();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`${API_BASE}/items/${item.id}/attachments?perpage=1`);
      const data = await response.json();
      const imageAttachments = data.filter((att: Attachment) => att.media_type === 'image' && att.url);
      setAttachments(imageAttachments);
    } catch (error) {
      console.error(`Failed to fetch attachments for item ${item.id}`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const mainAttachment = attachments.length > 0 ? attachments[0] : null;

  return (
    <div
      ref={cardRef}
      className="image-card"
    >
      <div className="image-container">
        {isLoading ? (
          <div className="card-spinner"></div>
        ) : mainAttachment ? (
          <img
            src={mainAttachment.url}
            alt={mainAttachment.alt_text || mainAttachment.title || 'Imagem da galeria'}
            className="card-image"
          />
        ) : (
            <span className="no-image">Sem imagem</span>
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
