// src/components/ClientParteButtons.tsx
'use client';

import { useState } from 'react';
import EditParteModal from '@/components/EditParteModal';

type ExpedienteRef = { id: number; codigo: string; proyecto?: string | null };
type TareaRef = { id: number; titulo: string; expediente_id: number };

type Props = {
  expedientes: ExpedienteRef[];
  tareas: TareaRef[];
  onCreate?: (payload: any) => Promise<void> | void;
};

export default function ClientParteButtons({ expedientes, tareas, onCreate }: Props) {
  const [open, setOpen] = useState(false);

  const DEFAULT_PARTE = {
    id: 0,
    expediente_id: null as number | null,
    tarea_id: null as number | null,
    fecha: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    hora_inicio: '08:00',
    hora_fin: '09:00',
    horas: 1,
    comentario: '',
  };

  async function handleCreate(payload: any) {
    try {
      if (onCreate) await onCreate(payload);
    } finally {
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Nuevo parte"
        onClick={() => setOpen(true)}
        className="btn btn-primary"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <span>➕</span>
        <span>Nuevo parte</span>
      </button>

      <EditParteModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleCreate}
        title="Nuevo parte"
        expedientes={expedientes || []}
        tareas={tareas || []}
        parte={DEFAULT_PARTE}
      />
    </>
  );
}
