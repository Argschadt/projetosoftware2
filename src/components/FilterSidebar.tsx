// src/components/FilterSidebar.tsx
import React from 'react';
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
}) => {
  
  const renderFilterSection = (title: string, items: string[], selectedItems: string[], onChange: (item: string) => void) => (
    <div className="filter-section">
      <h4>{title}</h4>
      <div className="filter-options">
        {items.map(item => (
          <div key={item} className="filter-option">
            <input
              type="checkbox"
              id={`${title}-${item}`}
              checked={selectedItems.includes(item)}
              onChange={() => onChange(item)}
            />
            <label htmlFor={`${title}-${item}`}>{item}</label>
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
      
      {renderFilterSection("Autores", authors, selectedAuthors, onAuthorChange)}
      {renderFilterSection("Datas", dates, selectedDates, onDateChange)}
      {renderFilterSection("Tipos", types, selectedTypes, onTypeChange)}
    </div>
  );
};

export default FilterSidebar;
