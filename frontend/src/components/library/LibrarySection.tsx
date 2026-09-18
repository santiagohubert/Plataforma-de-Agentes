'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { LibrarySection as LibrarySectionType, LibraryItem } from '@/lib/mock-library-data';
import { LibraryCard } from './LibraryCard';

interface LibrarySectionProps {
  section: LibrarySectionType;
  onCardClick?: (item: LibraryItem) => void;
  forceExpandAll?: boolean; // Se activa cuando hay una búsqueda activa
}

export const LibrarySection: React.FC<LibrarySectionProps> = ({
  section,
  onCardClick,
  forceExpandAll = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Si hay búsqueda activa o el usuario lo expandió, mostrar todos; si no, mostrar los primeros 3
  const visibleItems =
    forceExpandAll || isExpanded ? section.items : section.items.slice(0, 3);
  const hasMoreItems = section.items.length > 3;

  if (section.items.length === 0) {
    return null;
  }

  return (
    <section className="library-section" aria-labelledby={`section-${section.id}`}>
      <div className="library-section-header">
        <div className="library-section-title-wrap">
          <div className="library-section-title-row">
            <h3 id={`section-${section.id}`} className="library-section-title">
              {section.title}
            </h3>
            <span className="library-section-badge">{section.items.length}</span>
          </div>
          <p className="library-section-subtitle">{section.subtitle}</p>
        </div>

        {!forceExpandAll && hasMoreItems && (
          <button
            type="button"
            className="library-section-toggle-btn"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            title={isExpanded ? 'Mostrar menos recursos' : 'Ver todos los recursos'}
          >
            <span>{isExpanded ? 'Ver menos' : `Ver todos (${section.items.length})`}</span>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      <div className="library-cards-grid">
        {visibleItems.map((item) => (
          <LibraryCard key={item.id} item={item} onClick={onCardClick} />
        ))}
      </div>
    </section>
  );
};
