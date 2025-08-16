// src/components/DeleteParteDialog.tsx
'use client';

import React from 'react';
import Modal from '@/components/Modal';

export default function DeleteParteDialog(props: any) {
  const open: boolean = props.open ?? props.isOpen ?? false;
  const onClose: () => void = props.onClose ?? (() => {});
  const onConfirm: () => Promise<void> | void = props.onConfirm ?? (() => {});
  const title: string = props.title ?? 'Eliminar parte';
  const message: string = props.message ?? '¿Seguro que quieres eliminar este parte?';

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-4">{message}</p>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onClose} className="btn-secondary" title="Cancelar">
          ✖
        </button>
        <button type="button" onClick={async () => await onConfirm()} className="btn-danger" title="Eliminar">
          🗑️
        </button>
      </div>
    </Modal>
  );
}
