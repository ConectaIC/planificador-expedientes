// src/components/ClientCreateParte.tsx
'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import NewParteModal from '@/components/NewParteModal';

type ExpedienteRef = { id: number; codigo: string };
type TareaRef = { id: number; titulo: string };

export default function ClientCreateParte(
  { expedientes, tareas }: { expedientes: ExpedienteRef[]; tareas: TareaRef[] }
) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Nuevo parte"
        title="Nuevo parte"
        className="btn-icon"
        onClick={() => setOpen(true)}
      >
        ➕
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo parte" widthClass="max-w-xl">
        <NewParteModal
          expedientes={expedientes}
          tareas={tareas}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
