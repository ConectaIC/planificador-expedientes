// src/components/TareaRowActions.tsx
// Tipo: Client Component

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';
import TareaForm from './TareaForm';
import ConfirmDialog from './ConfirmDialog';

type ExpedienteMini = { id: number; codigo: string; proyecto?: string | null };
type Tarea = {
  id: number;
  titulo: string;
  estado: string | null;
  prioridad: string | null;
  horas_previstas: number | null;
  horas_realizadas: number | null;
  vencimiento: string | null;
  expediente_id: number;
};

export default function TareaRowActions({ tarea, expedientes }: { tarea: Tarea; expedientes: ExpedienteMini[] }) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function borrar() {
    try {
      setBusy(true);
      const res = await fetch(`/api/tareas/${tarea.id}`, { method: 'DELETE' });
      const j = await res.json();
      if (!j?.ok) alert('Error al borrar: ' + (j?.error || 'desconocido'));
      router.refresh();
    } catch (e: any) {
      alert('Error al borrar: ' + e?.message);
    } finally {
      setBusy(false);
    }
  }

  const btn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 6,
    border: '1px solid var(--cic-border,#dcdcdc)',
    background: 'var(--cic-bg-card,#fff)',
    marginRight: 6,
    cursor: 'pointer',
  };

  return (
    <span>
      <button type="button" style={btn} title="Editar" aria-label="Editar" onClick={() => setOpenEdit(true)}>✏️</button>
      <button type="button" style={btn} title="Borrar" aria-label="Borrar" onClick={() => setOpenDel(true)}>🗑️</button>

      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Editar tarea">
        <TareaForm
          expedientes={expedientes as any}
          initial={tarea as any}
          onSaved={() => { setOpenEdit(false); router.refresh(); }}
        />
      </Modal>

      <ConfirmDialog
        open={openDel}
        onClose={() => setOpenDel(false)}
        title="Borrar tarea"
        confirmText={busy ? 'Borrando…' : 'Borrar'}
        cancelText="Cancelar"
        onConfirm={borrar}
      >
        <p>¿Seguro que deseas borrar la tarea <strong>{tarea.titulo}</strong>?</p>
      </ConfirmDialog>
    </span>
  );
}
