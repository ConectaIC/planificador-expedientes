'use client';
import React from 'react';

export default function Modal({
  open,
  title,
  children,
  onClose,
  width = 720,
}: {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  width?: number;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog" aria-modal="true"
      style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,.35)',
        display:'grid', placeItems:'center', padding:16, zIndex:50
      }}
      onClick={onClose}
    >
      <div
        onClick={(e)=>e.stopPropagation()}
        style={{
          background:'#fff', borderRadius:12, padding:16,
          width:'min(96vw, '+width+'px)', boxShadow:'0 10px 30px rgba(0,0,0,.2)',
          display:'grid', gap:12
        }}
      >
        {title && <h3 style={{margin:0}}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}
