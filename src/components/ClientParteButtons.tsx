// src/components/ClientParteButtons.tsx
'use client';

import { useState } from 'react';
import EditParteModal from '@/components/EditParteModal';
import DeleteParteDialog from '@/components/DeleteParteDialog';

type ExpedienteRef = { id: number; codigo: string; proyecto?: string | null };
type TareaRef = { id: number; titulo: string; expediente_id: number };

type Props = {
  /** listados que alimentan los select del modal */
  expedientes: ExpedienteRef[];
  tareas: TareaRef[];
  /** callback opcional tras crear */
  onCreate?: (payload: any) => Promise<void> | void;
};

/**
 * Botón ➕ para crear partes (abre el modal).
 * También mantiene el import de DeleteParteDialog por si este
 * componente se usa en otra vista con acciones por fila.
 */
export default function ClientParteButtons({ expedientes, tareas, onCreate }: Props) {
  const [open, setOpen] = useState(false);

  // Objeto por defecto que cumple la forma de ParteDTO
  const DEFAULT_PARTE = {
    id: 0,
    expediente_id: null as number | null,
    tarea_id: null as number | null,
    // Fecha ISO YYYY-MM-DD para el <input type="date" />
    fecha: new Date().toISOString().slice(0, 10),
    // Valores iniciales alineados a 15 minutos
    hora_inicio: '08:00',
    hora_fin: '09:00',
    horas: 1,
    comentario: '',
  };

  async function handleCreate(payload: any) {
    try {
      if (onCreate) {
        await onCreate(payload);
      }
    } finally {
      setOpen(false);
    }
  }

  return (
    <>
      {/* Botón principal para abrir el modal de "Nuevo parte" */}
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

      {/* Modal de creación */}
      <EditParteModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleCreate}               {/* <— antes era onSubmit */}
        title="Nuevo parte"
        expedientes={expedientes || []}
        tareas={tareas || []}
        parte={DEFAULT_PARTE}               {/* <— antes era {} */}
      />
    </>
  );
}
