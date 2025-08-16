// src/components/ClientParteButtons.tsx
'use client';

import React, { useState } from 'react';
import EditParteModal from '@/components/EditParteModal';
import DeleteParteDialog from '@/components/DeleteParteDialog';

type ExpedienteRef = { id: number; codigo: string };
type TareaRef = { id: number; titulo: string };

export default function ClientParteButtons({
  mode,           // 'create' | 'edit' | 'delete'
  parte,          // registro de parte (para edit/delete)
  expedientes,    // lista para selects
  tareas,         // lista para selects
  onDone,         // callback para "refrescar" tras OK
}: {
  mode: 'create' | 'edit' | 'delete';
  parte?: any;
  expedientes?: ExpedienteRef[];
  tareas?: TareaRef[];
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const handleCreate = async (payload: any) => {
    // TODO: aquí añadiremos la llamada real a Supabase (insert)
    console.log('create parte payload', payload);
    setOpen(false);
    onDone?.();
  };

  const handleEdit = async (payload: any) => {
    // TODO: aquí añadiremos la llamada real a Supabase (update)
    console.log('edit parte payload', payload);
    setOpen(false);
    onDone?.();
  };

  const handleDelete = async () => {
    // TODO: aquí añadiremos la llamada real a Supabase (delete)
    console.log('delete parte id', parte?.id);
    setOpen(false);
    onDone?.();
  };

  if (mode === 'create') {
    return (
      <>
        <button className="icon-btn" title="Nuevo parte" onClick={() => setOpen(true)}>
          ➕
        </button>
        <EditParteModal
          open={open}
          onClose={() => setOpen(false)}
          onSubmit={handleCreate}
          title="Nuevo parte"
          expedientes={expedientes || []}
          tareas={tareas || []}
          parte={{}}
        />
      </>
    );
  }

  if (mode === 'edit') {
    return (
      <>
        <button className="icon-btn" title="Editar parte" onClick={() => setOpen(true)}>
          ✏️
        </button>
        <EditParteModal
          open={open}
          onClose={() => setOpen(false)}
          onSubmit={handleEdit}
          title="Editar parte"
          expedientes={expedientes || []}
          tareas={tareas || []}
          parte={parte}
        />
      </>
    );
  }

  // delete
  return (
    <>
      <button className="icon-btn" title="Eliminar parte" onClick={() => setOpen(true)}>
        🗑️
      </button>
      <DeleteParteDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar parte"
        message="¿Seguro que quieres eliminar este parte?"
      />
    </>
  );
}
