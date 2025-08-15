// src/components/NewParteModal.tsx
'use client';

import React from 'react';
import Modal from './Modal';
import ParteForm from './ParteForm';

type Expediente = { id: number; codigo: string; proyecto?: string | null };
type Tarea = { id: number; titulo: string; expediente_id: number };

type Props = {
  expedientes: Expediente[];
  tareas: Tarea[];
  onCreated?: () => void;
};

export default function NewParteModal({ expedientes, tareas, onCreated }: Props) {
  const [open, setOpen] = React.useState(false);

  const btn: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--cic-border, #dcdcdc)',
    background: 'var(--cic-primary-bg, #eef4ff)',
    cursor: 'pointer',
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={btn}>+ Nuevo parte</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo parte">
        <ParteForm expedientes={expedientes} tareas={tareas} onCreated={() => { setOpen(false); onCreated?.(); }} />
      </Modal>
    </>
  );
}
