'use client';
import { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import ExpedienteEditModal, { ExpedienteData } from './ExpedienteEditModal';

export default function ExpedienteActions({ exp }: { exp: ExpedienteData }) {
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);

  async function doDelete() {
    const r = await fetch(`/api/expedientes/${exp.id}`, { method: 'DELETE' });
    const j = await r.json();
    if (!r.ok || j.ok === false) alert(j.error || 'Error al borrar');
    else window.location.reload();
  }

  return (
    <div className="flex gap-2 items-center">
      <button title="Editar" onClick={()=>setEditOpen(true)} className="px-2 py-1 rounded border">✏️</button>
      <button title="Borrar" onClick={()=>setDelOpen(true)} className="px-2 py-1 rounded border">🗑️</button>

      <ExpedienteEditModal open={editOpen} onClose={()=>setEditOpen(false)} expediente={exp} />
      <ConfirmDialog
        open={delOpen}
        onClose={()=>setDelOpen(false)}
        title="Borrar expediente"
        message={`¿Borrar el expediente ${exp.codigo ?? ''}? Esta acción no se puede deshacer.`}
        confirmText="Borrar"
        onConfirm={doDelete}
      />
    </div>
  );
}
