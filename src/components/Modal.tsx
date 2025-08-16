'use client';

import { useEffect, useCallback, ReactNode } from 'react';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Clase tailwind para controlar el ancho máximo del cuadro de diálogo. Ej: "max-w-xl" */
  widthClass?: string; // <- añadida para soportar casos como ExpedienteRowActions
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  widthClass = 'max-w-lg', // tamaño por defecto
}: ModalProps) {
  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleEsc);
    // bloquear scroll de fondo
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, handleEsc]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        // cerrar al hacer click fuera del contenido
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Dialog */}
      <div
        className={`relative w-[92vw] ${widthClass} bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200/50 dark:border-neutral-800 p-4 sm:p-6`}
      >
        {title ? (
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-full px-2 py-1 text-xl leading-none hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="mb-1 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-full px-2 py-1 text-xl leading-none hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              ×
            </button>
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>
  );
}
