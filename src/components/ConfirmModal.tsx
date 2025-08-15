// src/components/ConfirmModal.tsx
'use client';

import React from 'react';
import Modal from './Modal';

type Props = {
  open: boolean;
  title?: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmModal({ open, title = 'Confirmar', message, onCancel, onConfirm }: Props) {
  const row: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 };
  const btn: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--cic-border, #dcdcdc)',
    background: 'var(--cic-bg, #f7f7f7)',
    cursor: 'pointer',
  };
  const btnDanger: React.CSSProperties = { ...btn, background: 'var(--cic-danger-bg, #ffecec)' };

  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p>{message}</p>
      <div style={row}>
        <button type="button" onClick={onCancel} style={btn}>Cancelar</button>
        <button type="button" onClick={onConfirm} style={btnDanger}>Eliminar</button>
      </div>
    </Modal>
  );
}
