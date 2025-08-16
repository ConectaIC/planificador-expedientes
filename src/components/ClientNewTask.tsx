// src/components/ClientNewTask.tsx
'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import NuevaTareaModal from '@/components/NuevaTareaModal';

export default function ClientNewTask(
  { expedienteId, action }: { expedienteId: number; action?: (fd: FormData) => Promise<void> }
) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Nueva tarea"
        title="Nueva tarea"
        className="btn-icon"
        onClick={() => setOpen(true)}
      >
        ➕
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva tarea" widthClass="max-w-lg">
        <NuevaTareaModal
          expedienteId={expedienteId}
          onSuccess={() => setOpen(false)}
          onSubmitAction={action}
        />
      </Modal>
    </>
  );
}
