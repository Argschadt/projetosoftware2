import React, { useState, useEffect } from 'react';
import './ImageCard.css';
import { API_BASE } from '../config';
import { Item, Attachment } from '../types';

interface ImageCardProps {
  item: Item;
  // new optional props to support selection from parent Gallery
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ item, selectable = false, isSelected = false, onToggleSelect }) => {
  const [finalImageUrl, setFinalImageUrl] = useState<string | null | undefined>(item.imageUrl ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !Boolean(item.imageUrl));

  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();

    if (item.imageUrl) {
      setFinalImageUrl(item.imageUrl);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(`${API_BASE}/items/${item.id}/attachments?perpage=5`, { signal: controller.signal })
      .then(res => res.json())
      .then((attachments: Attachment[]) => {
        if (aborted) return;
        const imageAttachment = attachments.find((att) => att.media_type === 'image' && att.url);
        if (imageAttachment) {
          setFinalImageUrl(imageAttachment.url);
        } else {
          setFinalImageUrl(null);
        }
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        console.error(`Failed to fetch fallback attachments for item ${item.id}`, error);
      })
      .finally(() => {
        if (!aborted) setIsLoading(false);
      });

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [item.id, item.imageUrl]);

  return (
    <div className={"image-card" + (isSelected ? ' selected' : '')}>
      <div className="image-container">
        {selectable && (
          <button
            className="select-badge"
            aria-pressed={isSelected}
            title={isSelected ? 'Selecionado' : 'Selecionar'}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onToggleSelect) onToggleSelect(item.id);
            }}
          >
            {isSelected ? '✓' : '+'}
          </button>
        )}
        {isLoading ? (
          <div className="card-spinner" />
        ) : finalImageUrl ? (
          <img
            src={finalImageUrl}
            alt={item.title ?? `Imagem da obra ${item.id}`}
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
        <h3 className="card-title">{item.title ?? `Item ${item.id}`}</h3>
      </div>
    </div>
  );
};

export default ImageCard;
