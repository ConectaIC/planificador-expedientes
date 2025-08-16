'use client';
import React from 'react';

export type ModalProps = {
  open: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  onClose: () => void;
  children: React.ReactNode;
};

export default function Modal({ open, title, size = 'md', onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <strong>{title}</strong>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✖️</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
