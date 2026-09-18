'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface LibrarySearchProps {
  query: string;
  onChange: (value: string) => void;
  onClear: () => void;
  totalResults?: number;
  isFiltering?: boolean;
}

export const LibrarySearch: React.FC<LibrarySearchProps> = ({
  query,
  onChange,
  onClear,
  totalResults,
  isFiltering,
}) => {
  return (
    <div className="library-search-container">
      <div className="library-search-box">
        <Search size={18} className="library-search-icon" />
        <input
          type="text"
          className="library-search-input"
          placeholder="Buscar ejercicios, guías, libros o podcasts..."
          value={query}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Buscar en la biblioteca"
        />
        {query && (
          <button
            type="button"
            className="library-search-clear"
            onClick={onClear}
            title="Limpiar búsqueda"
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isFiltering && (
        <div className="library-search-status" aria-live="polite">
          {totalResults === 0 ? (
            <span>No se encontraron resultados para &ldquo;{query}&rdquo;</span>
          ) : (
            <span>
              {totalResults} {totalResults === 1 ? 'resultado' : 'resultados'} encontrados
            </span>
          )}
        </div>
      )}
    </div>
  );
};
