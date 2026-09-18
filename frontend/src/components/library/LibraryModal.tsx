'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Library, Sparkles } from 'lucide-react';
import { MOCK_LIBRARY_SECTIONS, LibraryItem } from '@/lib/mock-library-data';
import { LibrarySearch } from './LibrarySearch';
import { LibrarySection } from './LibrarySection';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemToast, setSelectedItemToast] = useState<string | null>(null);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Prevenir scroll en el body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Filtrar secciones según la búsqueda
  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return MOCK_LIBRARY_SECTIONS;

    return MOCK_LIBRARY_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query) ||
          item.badge.toLowerCase().includes(query)
      ),
    })).filter((section) => section.items.length > 0);
  }, [searchQuery]);

  const totalResults = useMemo(() => {
    return filteredSections.reduce((acc, sec) => acc + sec.items.length, 0);
  }, [filteredSections]);

  const handleCardClick = (item: LibraryItem) => {
    // Feedback visual simple sin navegación ni detalle complejo
    setSelectedItemToast(`Recurso mock: "${item.title}". Las fuentes reales se conectarán próximamente.`);
    setTimeout(() => {
      setSelectedItemToast(null);
    }, 3500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="library-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="library-modal-title"
    >
      <div className="library-modal-panel">
        {/* Header propio de la Biblioteca */}
        <header className="library-modal-header">
          <div className="library-header-branding">
            <div className="library-header-icon-badge">
              <Library size={22} className="library-brand-icon" />
            </div>
            <div>
              <div className="library-header-title-row">
                <h2 id="library-modal-title" className="library-modal-title">
                  ÍNDICE BIBLIOTECA BIO
                </h2>
                <span className="library-header-pill">MOCK DATA</span>
              </div>
              <p className="library-modal-subtitle">
                Recursos y materiales de Bioenergética de ALBIO
              </p>
            </div>
          </div>

          <button
            type="button"
            className="library-modal-close-btn"
            onClick={onClose}
            title="Cerrar biblioteca (Esc)"
            aria-label="Cerrar biblioteca"
          >
            <X size={22} />
          </button>
        </header>

        {/* Buscador visual con filtrado en memoria */}
        <div className="library-modal-toolbar">
          <LibrarySearch
            query={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            totalResults={totalResults}
            isFiltering={searchQuery.trim().length > 0}
          />
        </div>

        {/* Notificación flotante informativa al tocar una tarjeta */}
        {selectedItemToast && (
          <div className="library-toast-alert" role="status">
            <Sparkles size={16} />
            <span>{selectedItemToast}</span>
          </div>
        )}

        {/* Área scrolleable de secciones */}
        <div className="library-modal-content">
          {filteredSections.length === 0 ? (
            <div className="library-empty-search">
              <p className="library-empty-title">
                No encontramos recursos que coincidan con &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="library-empty-desc">
                Probá buscando por &ldquo;grounding&rdquo;, &ldquo;respiración&rdquo;, &ldquo;Lowen&rdquo;, o limpiá el buscador.
              </p>
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchQuery('')}
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            filteredSections.map((section) => (
              <LibrarySection
                key={section.id}
                section={section}
                onCardClick={handleCardClick}
                forceExpandAll={searchQuery.trim().length > 0}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
