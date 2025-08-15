// src/components/Modal.tsx
'use client';

import React from 'react';

type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
};

export default function Modal({ open, title, onClose, children, width = 560 }: ModalProps) {
  if (!open) return null;

  const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  };
  const panel: React.CSSProperties = {
    width,
    maxWidth: '95vw',
    background: 'var(--cic-bg-card, #fff)',
    border: '1px solid var(--cic-border, #e5e5e5)',
    borderRadius: 10,
    boxShadow: '0 10px 30px rgba(0,0,0,.15)',
  };
  const header: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid var(--cic-border, #eee)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };
  const body: React.CSSProperties = { padding: 16 };
  const btnClose: React.CSSProperties = {
    border: '1px solid var(--cic-border, #ddd)',
    background: 'var(--cic-bg, #f7f7f7)',
    borderRadius: 6,
    padding: '6px 8px',
    cursor: 'pointer',
  };

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-label={title || 'Modal'}>
      <div style={panel}>
        <div style={header}>
          <strong>{title || 'Ventana'}</strong>
          <button type="button" onClick={onClose} style={btnClose}>Cerrar</button>
        </div>
        <div style={body}>{children}</div>
      </div>
    </div>
  );
}
