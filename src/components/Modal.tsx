// src/components/Modal.tsx
// Tipo: Client Component

'use client';

import React from 'react';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  widthClass?: string; // e.g., "max-w-xl"
  children: React.ReactNode;
};

export default function Modal({ open, onClose, title, widthClass = 'max-w-xl', children }: ModalProps) {
  if (!open) return null;

  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={onBackdrop}>
      <div className={`modal-panel ${widthClass}`} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="modal-title">{title || ''}</div>
          <button className="icon-btn" aria-label="Cerrar" onClick={onClose}>
            <span className="icon-emoji">✖️</span>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
