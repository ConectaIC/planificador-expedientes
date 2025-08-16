'use client';

import { ReactNode, useEffect } from 'react';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Ancho opcional del contenedor interno (Tailwind), p.ej. "max-w-xl" */
  widthClass?: string;
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  widthClass = 'max-w-md',
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
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenido */}
      <div
        className={`relative w-[92vw] sm:w-auto ${widthClass} rounded-xl bg-white shadow-lg p-5`}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title ?? ''}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar"
            title="Cerrar"
          >
            ✖️
          </button>
        </div>

        {/* Cuerpo */}
        <div>{children}</div>
      </div>
    </div>
  );
}
