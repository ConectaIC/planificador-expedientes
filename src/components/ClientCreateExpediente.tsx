// src/components/ClientCreateExpediente.tsx
'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import NewExpedienteModal from '@/components/NewExpedienteModal';

// Este wrapper existe porque la página es Server Component.
// Así mantenemos interactividad (abrir/cerrar modal) en cliente.
export default function ClientCreateExpediente(
  { action }: { action?: (form: FormData) => Promise<void> }
) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Nuevo expediente"
        title="Nuevo expediente"
        className="btn-icon"
        onClick={() => setOpen(true)}
      >
        ➕
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo expediente" widthClass="max-w-lg">
        {/* Si ya tienes NewExpedienteModal funcionando, lo reutilizamos */}
        <NewExpedienteModal
          onSuccess={() => setOpen(false)}
          // En caso de que uses server action externa:
          onSubmitAction={action}
        />
      </Modal>
    </>
  );
}
