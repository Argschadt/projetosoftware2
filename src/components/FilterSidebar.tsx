// src/components/FilterSidebar.tsx
import React from 'react';
import './FilterSidebar.css';

interface FilterSidebarProps {
  authors: string[];
  dates: string[];
  types: string[];
  authorCounts?: Record<string, number>;
  dateCounts?: Record<string, number>;
  typeCounts?: Record<string, number>;
  selectedAuthors: string[];
  selectedDates: string[];
  selectedTypes: string[];
  onAuthorChange: (author: string) => void;
  onDateChange: (date: string) => void;
  onTypeChange: (type: string) => void;
  isLoading: boolean; // Novo prop para o estado de carregamento
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  authors,
  dates,
  types,
  selectedAuthors,
  selectedDates,
  selectedTypes,
  onAuthorChange,
  onDateChange,
  onTypeChange,
  isLoading, // Recebe o estado de carregamento
  authorCounts = {},
  dateCounts = {},
  typeCounts = {},
}) => {
  
  // individual renderers used below: renderAuthors, renderDates, renderTypes

  const renderAuthors = () => (
    <div className="filter-section">
      <h4>Autores</h4>
      <div className="filter-options">
        {authors.map(author => (
          <div key={author} className="filter-option">
            <input
              type="checkbox"
              id={`Autores-${author}`}
              checked={selectedAuthors.includes(author)}
              onChange={() => onAuthorChange(author)}
            />
            <label htmlFor={`Autores-${author}`}>
              {author} <span style={{ opacity: 0.7 }}>({authorCounts[author] || 0})</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDates = () => (
    <div className="filter-section">
      <h4>Datas</h4>
      <div className="filter-options">
        {dates.map(d => (
          <div key={d} className="filter-option">
            <input
              type="checkbox"
              id={`Datas-${d}`}
              checked={selectedDates.includes(d)}
              onChange={() => onDateChange(d)}
            />
            <label htmlFor={`Datas-${d}`}>
              {d} <span style={{ opacity: 0.7 }}>({dateCounts[d] || 0})</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTypes = () => (
    <div className="filter-section">
      <h4>Tipos</h4>
      <div className="filter-options">
        {types.map(t => (
          <div key={t} className="filter-option">
            <input
              type="checkbox"
              id={`Tipos-${t}`}
              checked={selectedTypes.includes(t)}
              onChange={() => onTypeChange(t)}
            />
            <label htmlFor={`Tipos-${t}`}>
              {t} <span style={{ opacity: 0.7 }}>({typeCounts[t] || 0})</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="filter-sidebar">
        <h3 className="filter-title">Filtros</h3>
        <div className="filter-loading">
          <div className="spinner-sidebar"></div>
          <p>Carregando filtros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="filter-sidebar">
      <h3 className="filter-title">Filtros</h3>
      
  {renderAuthors()}
  {renderDates()}
  {renderTypes()}
    </div>
  );
};

export default FilterSidebar;
