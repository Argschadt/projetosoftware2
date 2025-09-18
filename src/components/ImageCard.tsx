import React, { useState, useEffect, useRef } from 'react';

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
      style={{
        background: 'white',
        borderRadius: '15px',
        overflow: 'hidden',
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'pointer',
        height: '255px', // Altura fixa para o card
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
        height: '180px',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {isLoading ? (
          <div style={{
            width: '30px',
            height: '30px',
            border: '3px solid #e0e0e0',
            borderTop: '3px solid #764ba2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        ) : mainAttachment ? (
          <img
            src={mainAttachment.url}
            alt={mainAttachment.alt_text || mainAttachment.title || 'Imagem da galeria'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          />
        ) : (
            <span style={{color: '#ccc', fontSize: '0.8rem'}}>Sem imagem</span>
        )}
      </div>
      <div style={{ padding: '15px' }}>
        <h3 style={{
          margin: '0',
          fontSize: '1rem',
          fontWeight: '600',
          color: '#333',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center'
        }}>
          {item.title || `Item ${item.id}`}
        </h3>
      </div>
    </div>
  );
};

export default ImageCard;
