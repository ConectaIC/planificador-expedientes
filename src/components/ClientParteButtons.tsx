// src/components/ClientParteButtons.tsx
'use client';

import React, { useState } from 'react';
import EditParteModal from '@/components/EditParteModal';
import DeleteParteDialog from '@/components/DeleteParteDialog';

// Parte por defecto para modo "crear"
const EMPTY_PARTE = {
  id: 0,                            // no se usará al crear
  expediente_id: null as number | null,
  tarea_id: null as number | null,
  fecha: new Date().toISOString().slice(0, 10), // YYYY-MM-DD de hoy
  hora_inicio: '08:00:00',          // respeta tu granularidad de 15'
  hora_fin: '08:15:00',             // respeta tu granularidad de 15'
  horas: null as number | null,     // si tienes trigger, puede ir null
  comentario: '',
};

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
          parte={EMPTY_PARTE}
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
