// src/components/Modal.tsx
// Tipo: Client Component

'use client';

import { useEffect } from 'react';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  /** Clase para limitar el ancho del cuadro (ej. "max-w-md", "max-w-xl"). */
  widthClass?: string;
};

export default function Modal({ open, onClose, title, children, widthClass }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)', padding: 12 }}
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClass ?? 'max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--cic-bg-card, #fff)',
          color: 'var(--cic-text, #111)',
          border: '1px solid var(--cic-border, #e5e5e5)',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
        }}
      >
        {title ? <h3 style={{ marginBottom: 12 }}>{title}</h3> : null}
        {children}
      </div>
    </div>
  );
}
