// src/components/ConfirmDialog.tsx
'use client';

import React from 'react';
import Modal from './Modal';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  /** Si se pasa children, se mostrará en lugar de message */
  children?: React.ReactNode;
};

export default function ConfirmDialog({
  open,
  onClose,
  title = 'Confirmar',
  message = '¿Deseas continuar?',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm,
  children,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {/* Aplicamos el ancho aquí en vez de usar widthClass en Modal */}
      <div className="max-w-md w-full">
        <div className="mb-4">
          {children ? children : <p className="text-sm text-gray-700">{message}</p>}
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-[var(--cic-primary,#0b5fff)] text-white"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
