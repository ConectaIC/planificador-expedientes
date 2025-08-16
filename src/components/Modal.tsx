'use client';

import React, { useEffect } from 'react';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--cic-bg-card, #fff)',
          color: 'var(--cic-text, #111)',
          border: '1px solid var(--cic-border, #e5e5e5)',
          borderRadius: 12,
          padding: 16,
          width: 'min(640px, 92vw)',
          boxShadow: '0 10px 30px rgba(0,0,0,.1)',
        }}
      >
        {title ? <h3 style={{ margin: '0 0 12px 0' }}>{title}</h3> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
