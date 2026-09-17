'use client';

import React from 'react';
import { X, ArrowRight } from 'lucide-react';

interface LimitGateModalProps {
  isOpen: boolean;
  onRegister: () => void;
  onDismiss: () => void;
}

export const LimitGateModal: React.FC<LimitGateModalProps> = ({
  isOpen,
  onRegister,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" id="modalRegistro">
      <div className="modal-card">
        <button
          onClick={onDismiss}
          className="modal-close-btn"
          title="Cerrar"
        >
          <X size={20} />
        </button>

        <h3 className="modal-title">¿Querés seguir hablando con ALBIO?</h3>
        <p className="modal-desc">
          No vas a perder lo que charlamos hasta acá. Para continuar, creá tu cuenta en SENS: es gratis y lleva menos de un minuto.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            id="btnRegistro"
            className="btn-primary"
            onClick={onRegister}
          >
            <span>Sí, quiero registrarme</span>
            <ArrowRight size={18} />
          </button>

          <button
            id="btnAhoraNo"
            className="btn-secondary-text"
            onClick={onDismiss}
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
};
