'use client';

import React from 'react';
import { Video, FileText, BookOpen, Headphones } from 'lucide-react';
import { LibraryItem } from '@/lib/mock-library-data';

interface LibraryCardProps {
  item: LibraryItem;
  onClick?: (item: LibraryItem) => void;
}

export const LibraryCard: React.FC<LibraryCardProps> = ({ item, onClick }) => {
  const renderIcon = () => {
    switch (item.iconType) {
      case 'video':
        return <Video size={28} className="library-card-icon" />;
      case 'guide':
        return <FileText size={28} className="library-card-icon" />;
      case 'book':
        return <BookOpen size={28} className="library-card-icon" />;
      case 'podcast':
        return <Headphones size={28} className="library-card-icon" />;
      default:
        return <FileText size={28} className="library-card-icon" />;
    }
  };

  return (
    <article
      className="library-card"
      onClick={() => onClick?.(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.(item);
        }
      }}
      aria-label={`${item.title} (${item.type})`}
    >
      {/* Thumbnail estilizado / Placeholder sobrio */}
      <div className={`library-card-thumb thumb-type-${item.iconType}`}>
        <div className="library-card-thumb-pattern" aria-hidden="true" />
        <div className="library-card-icon-wrapper">{renderIcon()}</div>
        <span className="library-card-thumb-badge">{item.badge}</span>
      </div>

      {/* Contenido de la tarjeta */}
      <div className="library-card-body">
        <div className="library-card-meta-row">
          <span className="library-card-type">{item.type}</span>
          <span className="library-card-meta-dot">•</span>
          <span className="library-card-meta-info">{item.metadata}</span>
        </div>

        <h4 className="library-card-title" title={item.title}>
          {item.title}
        </h4>

        <p className="library-card-desc">{item.description}</p>
      </div>
    </article>
  );
};
