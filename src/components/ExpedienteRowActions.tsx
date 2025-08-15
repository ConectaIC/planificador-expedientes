// src/components/ExpedienteRowActions.tsx
// Tipo: Client Component

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from './ConfirmDialog';
import ExpedienteEditModal from './ExpedienteEditModal';

type Expediente = {
  id: number;
  codigo: string;
  proyecto: string | null;
  cliente: string | null;
  fin: string | null;
  prioridad: string | null;
  estado: string | null;
};

export default function ExpedienteRowActions({ expediente }: { expediente: Expediente }) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function borrar() {
    try {
      setBusy(true);
      const res = await fetch(`/api/expedientes/${expediente.id}`, { method: 'DELETE' });
      const j = await res.json();
      if (!j?.ok) alert('Error al borrar: ' + (j?.error || 'desconocido'));
      router.refresh();
    } catch (e: any) {
      alert('Error al borrar: ' + e?.message);
    } finally {
      setBusy(false);
    }
  }

  const btn = {
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
  } as React.CSSProperties;

  return (
    <span>
      <button type="button" style={btn} title="Editar" aria-label="Editar" onClick={() => setOpenEdit(true)}>✏️</button>
      <button type="button" style={btn} title="Borrar" aria-label="Borrar" onClick={() => setOpenDel(true)}>🗑️</button>

      {openEdit && (
        <ExpedienteEditModal
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          expediente={expediente as any}
          onSaved={() => { setOpenEdit(false); router.refresh(); }}
        />
      )}

      <ConfirmDialog
        open={openDel}
        onClose={() => setOpenDel(false)}
        title="Borrar expediente"
        confirmText={busy ? 'Borrando…' : 'Borrar'}
        cancelText="Cancelar"
        onConfirm={borrar}
      >
        <p>¿Seguro que deseas borrar el expediente <strong>{expediente.codigo}</strong>?</p>
      </ConfirmDialog>
    </span>
  );
}
