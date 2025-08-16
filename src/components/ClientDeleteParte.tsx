// src/components/ClientDeleteParte.tsx
'use client';

import { useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function ClientDeleteParte({ id }: { id: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Borrar parte"
        title="Borrar parte"
        className="btn-icon"
        onClick={() => setOpen(true)}
      >
        🗑️
      </button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Borrar parte"
        message="¿Seguro que deseas borrar este parte?"
        confirmText="Borrar"
        cancelText="Cancelar"
        onConfirm={async () => {
          try {
            // Igual que en tareas: aquí puedes llamar a una server action o a un endpoint /api
            console.warn('DeleteParte sin server action ligada. Implementa la acción.');
          } finally {
            setOpen(false);
          }
        }}
      />
    </>
  );
}
