'use client';

import { useState } from 'react';
import EditParteModal, { type EditPartePayload } from '@/components/EditParteModal';
import type { ExpedienteRef, TareaRef, ParteDTO } from '@/types';

type Props = {
  parte: ParteDTO;
  expedientes: ExpedienteRef[];
  tareas: TareaRef[]; // <- mismos tipos compartidos
  onSave: (p: EditPartePayload) => Promise<void> | void;
};

export default function ParteRowActions({ parte, expedientes, tareas, onSave }: Props) {
  const [openEdit, setOpenEdit] = useState(false);

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          className="icon-btn"
          title="Editar parte"
          onClick={() => setOpenEdit(true)}
        >
          ✏️
        </button>
        {/* Si tienes borrar, añádelo aquí */}
      </div>

      {/* Modal edición */}
      <EditParteModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        parte={parte}
        expedientes={expedientes}
        tareas={tareas}
        onSave={async (payload) => {
          await onSave(payload);
          setOpenEdit(false);
        }}
      />
    </>
  );
}
