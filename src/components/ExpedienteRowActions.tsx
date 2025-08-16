// src/components/ExpedienteRowActions.tsx
// Tipo: Client Component

'use client';

import { useState, useTransition } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';

type Expediente = {
  id: number;
  codigo: string;
  proyecto: string | null;
  cliente: string | null;
  inicio: string | null;
  fin: string | null;
  prioridad: string | null;
  estado: string | null;
  horas_previstas: number | null;
  horas_reales: number | null;
};

type Props = {
  expediente: Expediente;
  onUpdate: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
};

export default function ExpedienteRowActions({ expediente, onUpdate, onDelete }: Props) {
  const [openEdit, setOpenEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submitEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await onUpdate(fd);
        alert('Expediente actualizado');
        setOpenEdit(false);
      } catch (err: any) {
        alert(err?.message || 'Error al actualizar');
      }
    });
  };

  const doDelete = () => {
    const fd = new FormData();
    fd.set('id', String(expediente.id));
    startTransition(async () => {
      try {
        await onDelete(fd);
        alert('Expediente eliminado');
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
      {/* Editar */}
      <button className={iconBtn} aria-label="Editar" onClick={() => setOpenEdit(true)}>
        <span style={iconStyle}>✏️</span>
      </button>
      {/* Borrar */}
      <button className={iconBtn} aria-label="Borrar" onClick={() => setConfirm(true)}>
        <span style={iconStyle}>🗑️</span>
      </button>

      {/* Modal edición */}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title={`Editar ${expediente.codigo}`} widthClass="max-w-xl">
        <form onSubmit={submitEdit} className="space-y-3">
          <input type="hidden" name="id" value={expediente.id} />

          <div>
            <label className="block text-sm mb-1">Código *</label>
            <input name="codigo" required className="input" defaultValue={expediente.codigo} />
          </div>
          <div>
            <label className="block text-sm mb-1">Proyecto</label>
            <input name="proyecto" className="input" defaultValue={expediente.proyecto || ''} />
          </div>
          <div>
            <label className="block text-sm mb-1">Cliente</label>
            <input name="cliente" className="input" defaultValue={expediente.cliente || ''} />
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="block text-sm mb-1">Inicio</label>
              <input type="date" name="inicio" className="input" defaultValue={expediente.inicio || ''} />
            </div>
            <div>
              <label className="block text-sm mb-1">Fin</label>
              <input type="date" name="fin" className="input" defaultValue={expediente.fin || ''} />
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="block text-sm mb-1">Prioridad</label>
              <select name="prioridad" className="input" defaultValue={expediente.prioridad || ''}>
                <option value=""></option>
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Estado</label>
              <select name="estado" className="input" defaultValue={expediente.estado || ''}>
                <option value=""></option>
                <option value="Pendiente">Pendiente</option>
                <option value="En curso">En curso</option>
                <option value="En supervisión">En supervisión</option>
                <option value="Entregado">Entregado</option>
                <option value="Cerrado">Cerrado</option>
              </select>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="block text-sm mb-1">Horas previstas</label>
              <input name="horas_previstas" type="number" min="0" step="0.25" className="input" defaultValue={expediente.horas_previstas ?? 0} />
            </div>
            <div>
              <label className="block text-sm mb-1">Horas reales</label>
              <input name="horas_reales" type="number" min="0" step="0.25" className="input" defaultValue={expediente.horas_reales ?? 0} />
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

      {/* Confirmación de borrado */}
      {confirm && (
        <ConfirmDialog
          open={confirm}
          onClose={() => setConfirm(false)}
          title="Eliminar expediente"
          message={`¿Seguro que deseas eliminar el expediente ${expediente.codigo}? Esta acción no se puede deshacer.`}
          confirmText={isPending ? 'Eliminando…' : 'Eliminar'}
          cancelText="Cancelar"
          onConfirm={doDelete}
        />
      )}
    </div>
  );
}
