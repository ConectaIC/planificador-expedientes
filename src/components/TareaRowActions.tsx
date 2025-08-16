// src/components/TareaRowActions.tsx
// Tipo: Client Component

'use client';

import { useState, useTransition } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';

type ExpedienteMini = { id: number; codigo: string; proyecto?: string | null };

type Tarea = {
  id: number;
  titulo: string;
  expediente_id: number;
  horas_previstas: number | null;
  horas_realizadas: number | null;
  estado: string | null;     // Pendiente, En curso, Completada
  prioridad: string | null;  // Baja, Media, Alta
  vencimiento: string | null;
};

type Props = {
  tarea: Tarea;
  expedientes: ExpedienteMini[];
  onUpdate: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
};

export default function TareaRowActions({ tarea, expedientes, onUpdate, onDelete }: Props) {
  const [openEdit, setOpenEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submitEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await onUpdate(fd);
        alert('Tarea actualizada');
        setOpenEdit(false);
      } catch (err: any) {
        alert(err?.message || 'Error al actualizar');
      }
    });
  };

  const doDelete = () => {
    const fd = new FormData();
    fd.set('id', String(tarea.id));
    startTransition(async () => {
      try {
        await onDelete(fd);
        alert('Tarea eliminada');
        setConfirm(false);
      } catch (err: any) {
        alert(err?.message || 'Error al eliminar');
      }
    });
  };

  const iconBtn = 'inline-flex items-center justify-center rounded-lg btn-ghost';
  const iconStyle: React.CSSProperties = { fontSize: 18 };

  return (
    <div className="flex items-center justify-center gap-2">
      <button className={iconBtn} aria-label="Editar" onClick={() => setOpenEdit(true)}>
        <span style={iconStyle}>✏️</span>
      </button>
      <button className={iconBtn} aria-label="Borrar" onClick={() => setConfirm(true)}>
        <span style={iconStyle}>🗑️</span>
      </button>

      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Editar tarea" widthClass="max-w-xl">
        <form onSubmit={submitEdit} className="space-y-3">
          <input type="hidden" name="id" value={tarea.id} />

          <div>
            <label className="block text-sm mb-1">Título *</label>
            <input name="titulo" required className="input" defaultValue={tarea.titulo} />
          </div>

          <div>
            <label className="block text-sm mb-1">Expediente</label>
            <select name="expediente_id" className="input" defaultValue={tarea.expediente_id}>
              {expedientes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.codigo} {e.proyecto ? `— ${e.proyecto}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="block text-sm mb-1">Horas previstas</label>
              <input
                name="horas_previstas"
                type="number"
                min="0"
                step="0.25"
                className="input"
                defaultValue={tarea.horas_previstas ?? 0}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Horas realizadas</label>
              <input
                name="horas_realizadas"
                type="number"
                min="0"
                step="0.25"
                className="input"
                defaultValue={tarea.horas_realizadas ?? 0}
              />
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label className="block text-sm mb-1">Estado</label>
              <select name="estado" className="input" defaultValue={tarea.estado || ''}>
                <option value="Pendiente">Pendiente</option>
                <option value="En curso">En curso</option>
                <option value="Completada">Completada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Prioridad</label>
              <select name="prioridad" className="input" defaultValue={tarea.prioridad || ''}>
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Vencimiento</label>
              <input type="date" name="vencimiento" className="input" defaultValue={tarea.vencimiento || ''} />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setOpenEdit(false)} className="px-4 py-2 rounded-lg border">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg btn" disabled={isPending}>
              {isPending ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Modal>

      {confirm && (
        <ConfirmDialog
          open={confirm}
          onClose={() => setConfirm(false)}
          title="Eliminar tarea"
          message={`¿Seguro que deseas eliminar la tarea “${tarea.titulo}”?`}
          confirmText={isPending ? 'Eliminando…' : 'Eliminar'}
          cancelText="Cancelar"
          onConfirm={doDelete}
        />
      )}
    </div>
  );
}
