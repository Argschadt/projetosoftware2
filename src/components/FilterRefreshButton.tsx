// src/components/FilterRefreshButton.tsx
import React, { useState } from 'react';

interface FilterRefreshButtonProps {
  onRefresh: () => Promise<void>;
  isCached: boolean;
  isUpdating: boolean;
}

const FilterRefreshButton: React.FC<FilterRefreshButtonProps> = ({
  onRefresh,
  isCached,
  isUpdating,
}) => {
  const [hasRefreshed, setHasRefreshed] = useState(false);

  const handleRefresh = async () => {
    try {
      setHasRefreshed(true);
      await onRefresh();
      setTimeout(() => setHasRefreshed(false), 2000);
    } catch (error) {
      console.error('Erro ao atualizar filtros:', error);
      setHasRefreshed(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#666' }}>
      {isCached && !isUpdating && (
        <>
          <span title="Filtros carregados do cache">💾 Do cache</span>
          <button
            onClick={handleRefresh}
            disabled={isUpdating}
            title="Atualizar filtros do servidor"
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              opacity: isUpdating ? 0.6 : 1,
              borderRadius: '4px',
              border: '1px solid #ccc',
              background: 'white',
            }}
          >
            {isUpdating ? '⏳...' : '🔄'}
          </button>
        </>
      )}
      {isUpdating && <span>🔄 Atualizando...</span>}
      {hasRefreshed && <span style={{ color: 'green' }}>✓ Atualizado!</span>}
    </div>
  );
};

export default FilterRefreshButton;
