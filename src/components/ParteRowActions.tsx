"use client";

import { useState } from "react";
import NewParteModal, { NewPartePayload } from "@/components/NewParteModal";
import EditParteModal, { ParteDTO, EditPartePayload } from "@/components/EditParteModal";

type ExpedienteRef = { id: number; codigo: string; proyecto?: string | null };
type TareaRef = { id: number; titulo: string };

export default function ParteRowActions({
  parte,
  expedientes,
  tareas,
  onCreate,
  onSave,
  onDelete,
}: {
  parte?: ParteDTO; // si hay parte -> muestra acciones de editar/borrar, si no -> solo “nuevo”
  expedientes: ExpedienteRef[];
  tareas: TareaRef[];
  onCreate: (p: NewPartePayload) => Promise<void> | void;
  onSave: (p: EditPartePayload) => Promise<void> | void;
  onDelete: (id: ParteDTO["id"]) => Promise<void> | void;
}) {
  const [openNew, setOpenNew] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Nuevo */}
      {!parte ? (
        <>
          <button
            type="button"
            className="icon-btn"
            title="Nuevo parte"
            onClick={() => setOpenNew(true)}
          >
            ➕
          </button>
          <NewParteModal
            open={openNew}
            onClose={() => setOpenNew(false)}
            expedientes={expedientes}
            tareas={tareas}
            onCreate={onCreate}
          />
        </>
      ) : (
        <>
          {/* Editar */}
          <button
            type="button"
            className="icon-btn"
            title="Editar parte"
            onClick={() => setOpenEdit(true)}
          >
            ✏️
          </button>

          {/* Borrar */}
          <button
            type="button"
            className="icon-btn"
            title="Eliminar parte"
            onClick={() => onDelete(parte.id)}
          >
            🗑️
          </button>

          <EditParteModal
            open={openEdit}
            onClose={() => setOpenEdit(false)}
            parte={parte}
            expedientes={expedientes}
            tareas={tareas}
            onSave={onSave}
          />
        </>
      )}
    </div>
  );
}
