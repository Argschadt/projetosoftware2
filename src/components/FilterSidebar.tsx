// src/components/FilterSidebar.tsx
import React, { useMemo } from 'react';
import './FilterSidebar.css';

interface FilterSidebarProps {
  authors: string[];
  dates: string[];
  types: string[];
  selectedAuthors: string[];
  selectedDates: string[];
  selectedTypes: string[];
  onAuthorChange: (author: string) => void;
  onDateChange: (date: string) => void;
  onTypeChange: (type: string) => void;
  isLoading: boolean;
}

// ✅ Otimização: Usar React.memo para evitar re-renderizações quando props não mudam
const FilterSidebar: React.FC<FilterSidebarProps> = React.memo(({
  authors,
  dates,
  types,
  selectedAuthors,
  selectedDates,
  selectedTypes,
  onAuthorChange,
  onDateChange,
  onTypeChange,
  isLoading,
}) => {
  
  // ✅ Otimização: Memoizar renderização dos filtros para evitar re-renderizações
  const renderAuthors = useMemo(() => (
    <div className="filter-section">
      <h4>Autores</h4>
      <div className="filter-options">
        {authors.map((author) => (
          <div key={author} className="filter-option">
            <input
              type="checkbox"
              id={`Autores-${author}`}
              checked={selectedAuthors.includes(author)}
              onChange={() => onAuthorChange(author)}
            />
            <label htmlFor={`Autores-${author}`}>
              {author}
            </label>
          </div>
        ))}
      </div>
    </div>
  ), [authors, selectedAuthors, onAuthorChange]);

  const renderDates = useMemo(() => (
    <div className="filter-section">
      <h4>Datas</h4>
      <div className="filter-options">
        {dates.map((d) => (
          <div key={d} className="filter-option">
            <input
              type="checkbox"
              id={`Datas-${d}`}
              checked={selectedDates.includes(d)}
              onChange={() => onDateChange(d)}
            />
            <label htmlFor={`Datas-${d}`}>
              {d}
            </label>
          </div>
        ))}
      </div>
    </div>
  ), [dates, selectedDates, onDateChange]);

  const renderTypes = useMemo(() => (
    <div className="filter-section">
      <h4>Tipos</h4>
      <div className="filter-options">
        {types.map((t) => (
          <div key={t} className="filter-option">
            <input
              type="checkbox"
              id={`Tipos-${t}`}
              checked={selectedTypes.includes(t)}
              onChange={() => onTypeChange(t)}
            />
            <label htmlFor={`Tipos-${t}`}>
              {t}
            </label>
          </div>
        ))}
      </div>
    </div>
  ), [types, selectedTypes, onTypeChange]);

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
      {renderAuthors}
      {renderDates}
      {renderTypes}
    </div>
  );
});

export default FilterSidebar;
