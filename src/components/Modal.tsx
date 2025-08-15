// src/components/Modal.tsx
'use client';

import React, { useEffect } from 'react';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /**
   * Ancho opcional heredado de componentes antiguos.
   * Ejemplos: "max-w-md", "max-w-lg". Se aplica al contenedor interno.
   */
  widthClass?: string;
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  widthClass,
}: ModalProps) {
  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Contenedor del modal */}
      <div
        className={[
          // Ancho por defecto + opcional
          'relative z-10 w-full',
          widthClass ? widthClass : 'max-w-lg',
          // Caja
          'bg-white rounded-2xl border border-[var(--cic-border,#e5e5e5)] shadow-xl',
          'p-4',
        ].join(' ')}
      >
        {/* Cabecera */}
        {(title ?? '').trim().length > 0 && (
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[var(--cic-text,#222)]">
              {title}
            </h3>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={onClose}
              className="rounded-lg px-2 py-1 border hover:bg-gray-50"
            >
              ✕
            </button>
          </div>
        )}

        {/* Contenido */}
        <div>{children}</div>
      </div>
    </div>
  );
}
