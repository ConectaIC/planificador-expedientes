'use client';

import { useState } from 'react';
import EditParteModal, { type EditPartePayload } from '@/components/EditParteModal';
import type { ExpedienteRef, TareaRef, ParteDTO } from '@/types';
import { createParteAction } from '@/app/partes/actions';

type Props = {
  expedientes: ExpedienteRef[];
  tareas: TareaRef[];
  onCreated?: () => void; // opcional: refrescar lista, toast, etc.
};

const today = new Date().toISOString().slice(0, 10);

const DEFAULT_PARTE: ParteDTO = {
  id: 0,                // valor dummy; el modal detecta "crear" si no hay id válido
  fecha: today,
  hora_inicio: null,
  hora_fin: null,
  expediente_id: null,
  tarea_id: null,
  descripcion: '',
  comentario: '',
};

export default function ClientParteButtons({ expedientes, tareas, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleCreate(payload: EditPartePayload) {
    if (busy) return;
    setBusy(true);
    try {
      // Llama a la server action que ya recalcula horas y revalida
      await createParteAction(payload as any);
      onCreated?.();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Botón flotante/primary para crear parte */}
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setOpen(true)}
      >
        ➕ Nuevo parte
      </button>

      {/* Modal de creación (sin prop title) */}
      <EditParteModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleCreate}
        expedientes={expedientes || []}
        tareas={tareas || []}
        parte={DEFAULT_PARTE}
      />
    </>
  );
}
