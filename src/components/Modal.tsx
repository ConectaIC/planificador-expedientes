'use client';

import { useEffect } from 'react';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** ancho opcional tipo tailwind, p.ej. "max-w-xl" */
  widthClass?: string;
};

export default function Modal({ open, onClose, title, children, widthClass = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* dialog */}
      <div className={`relative z-10 w-[90vw] ${widthClass} rounded-xl bg-white shadow-xl`}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-lg leading-none hover:bg-gray-100"
            aria-label="Cerrar"
            title="Cerrar"
          >
            ✖️
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
