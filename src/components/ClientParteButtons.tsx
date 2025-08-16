// src/components/ClientParteButtons.tsx
'use client';

import { useState } from 'react';
import NewParteModal from '@/components/NewParteModal';
import EditParteModal from '@/components/EditParteModal';
import DeleteParteDialog from '@/components/DeleteParteDialog';

type ExpedienteRef = { id: number; codigo: string };
type TareaRef = { id: number; titulo: string };
type ParteMin = {
  id: number;
  fecha?: string | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  comentario?: string | null;
  expediente_id: number;
  tarea_id?: number | null;
};

export function CreateParteButton({
  expedientes,
  tareas,
}: {
  expedientes: ExpedienteRef[];
  tareas: TareaRef[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-emoji success" title="Nuevo parte" onClick={() => setOpen(true)}>
        ➕
      </button>
      {open && (
        <NewParteModal
          open={open}
          onClose={() => setOpen(false)}
          expedientes={expedientes}
          tareas={tareas}
          // Si tu NewParteModal acepta onSuccess, puedes refrescar:
          onSuccess={() => {
            setOpen(false);
            // Opcional: window.location.reload();
          }}
        />
      )}
    </>
  );
}

export function EditParteButton({
  parte,
  expedientes,
  tareas,
}: {
  parte: ParteMin;
  expedientes: ExpedienteRef[];
  tareas: TareaRef[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-emoji" title="Editar parte" onClick={() => setOpen(true)}>
        ✏️
      </button>
      {open && (
        <EditParteModal
          open={open}
          onClose={() => setOpen(false)}
          parte={parte}
          expedientes={expedientes}
          tareas={tareas}
          onSuccess={() => {
            setOpen(false);
            // Opcional: window.location.reload();
          }}
        />
      )}
    </>
  );
}

export function DeleteParteButton({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-emoji danger" title="Borrar parte" onClick={() => setOpen(true)}>
        🗑️
      </button>
      {open && (
        <DeleteParteDialog
          open={open}
          onClose={() => setOpen(false)}
          id={id}
          onDeleted={() => {
            setOpen(false);
            // Opcional: window.location.reload();
          }}
        />
      )}
    </>
  );
}
