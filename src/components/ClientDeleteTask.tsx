// src/components/ClientDeleteTask.tsx
'use client';

import { useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function ClientDeleteTask(
  { id, action }: { id: number; action?: (id: number) => Promise<void> }
) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Borrar tarea"
        title="Borrar tarea"
        className="btn-icon"
        onClick={() => setOpen(true)}
      >
        🗑️
      </button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Borrar tarea"
        message="¿Seguro que deseas borrar esta tarea?"
        confirmText="Borrar"
        cancelText="Cancelar"
        onConfirm={async () => {
          try {
            if (action) {
              await action(id);
            } else {
              // Fallback: puedes implementar un fetch a un endpoint /api si aún no pasas server action
              console.warn('DeleteTask sin server action ligada. Implementa la acción.');
            }
          } finally {
            setOpen(false);
          }
        }}
      />
    </>
  );
}
