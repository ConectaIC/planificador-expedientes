// src/components/ExpedienteRowActions.tsx
'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import { updateExpedienteAction, deleteExpedienteAction } from '@/app/expedientes/actions';

type Expediente = {
  id: number;
  codigo: string;
  proyecto?: string | null;
  horas_previstas?: number | null;
  horas_realizadas?: number | null;
  estado?: string | null;
  prioridad?: string | null;
  vencimiento?: string | null; // YYYY-MM-DD
};

type Props = {
  expediente: Expediente;
  onUpdate?: () => void;
  onDelete?: () => void;
};

export default function ExpedienteRowActions({ expediente, onUpdate, onDelete }: Props) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDel, setOpenDel] = useState(false);

  // Estado local del formulario de edición
  const [form, setForm] = useState<Expediente>({
    id: expediente.id,
    codigo: expediente.codigo,
    proyecto: expediente.proyecto ?? '',
    horas_previstas: expediente.horas_previstas ?? null,
    horas_realizadas: expediente.horas_realizadas ?? null,
    estado: expediente.estado ?? '',
    prioridad: expediente.prioridad ?? '',
    vencimiento: expediente.vencimiento ?? '',
  });

  function update<K extends keyof Expediente>(k: K, v: Expediente[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();

    const fd = new FormData();
    fd.set('id', String(form.id));
    fd.set('codigo', (form.codigo || '').trim());
    fd.set('proyecto', (form.proyecto || '').toString());
    if (form.horas_previstas != null) fd.set('horas_previstas', String(form.horas_previstas));
    if (form.horas_realizadas != null) fd.set('horas_realizadas', String(form.horas_realizadas));
    fd.set('estado', (form.estado || '').toString());
    fd.set('prioridad', (form.prioridad || '').toString());
    fd.set('vencimiento', (form.vencimiento || '').toString());

    await updateExpedienteAction(fd);
    setOpenEdit(false);
    onUpdate?.();
  }

  async function confirmDelete() {
    // 🔧 Antes se creaba un FormData; ahora pasamos el number que espera la acción.
    await deleteExpedienteAction(expediente.id);
    setOpenDel(false);
    onDelete?.();
  }

  return (
    <div className="inline-flex items-center gap-2">
      {/* Botón editar */}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        aria-label="Editar expediente"
        onClick={() => {
          // refrescamos el form por si el padre lo actualizó
          setForm({
            id: expediente.id,
            codigo: expediente.codigo,
            proyecto: expediente.proyecto ?? '',
            horas_previstas: expediente.horas_previstas ?? null,
            horas_realizadas: expediente.horas_realizadas ?? null,
            estado: expediente.estado ?? '',
            prioridad: expediente.prioridad ?? '',
            vencimiento: expediente.vencimiento ?? '',
          });
          setOpenEdit(true);
        }}
      >
        ✏️
      </button>

      {/* Botón borrar */}
      <button
        type="button"
        className="btn btn-danger btn-sm"
        aria-label="Eliminar expediente"
        onClick={() => setOpenDel(true)}
      >
        🗑️
      </button>

      {/* Modal de edición */}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title={`Editar ${expediente.codigo}`}>
        <form onSubmit={submitEdit} className="space-y-3">
          <input type="hidden" name="id" value={form.id} />

          <div className="form-row">
            <label className="form-label">Código</label>
            <input
              className="form-input"
              value={form.codigo}
              onChange={(e) => update('codigo', e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label">Proyecto</label>
            <input
              className="form-input"
              value={form.proyecto ?? ''}
              onChange={(e) => update('proyecto', e.target.value)}
            />
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label">Horas previstas</label>
              <input
                type="number"
                step="0.25"
                min="0"
                className="form-input"
                value={form.horas_previstas ?? ''}
                onChange={(e) =>
                  update('horas_previstas', e.target.value === '' ? null : Number(e.target.value))
                }
              />
            </div>
            <div>
              <label className="form-label">Horas realizadas</label>
              <input
                type="number"
                step="0.25"
                min="0"
                className="form-input"
                value={form.horas_realizadas ?? ''}
                onChange={(e) =>
                  update('horas_realizadas', e.target.value === '' ? null : Number(e.target.value))
                }
              />
            </div>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label">Estado</label>
              <input
                className="form-input"
                value={form.estado ?? ''}
                onChange={(e) => update('estado', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Prioridad</label>
              <input
                className="form-input"
                value={form.prioridad ?? ''}
                onChange={(e) => update('prioridad', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Vencimiento</label>
            <input
              type="date"
              className="form-input"
              value={form.vencimiento ?? ''}
              onChange={(e) => update('vencimiento', e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setOpenEdit(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de confirmación de borrado */}
      <Modal open={openDel} onClose={() => setOpenDel(false)} title="Eliminar expediente">
        <div className="space-y-4">
          <p>
            ¿Seguro que quieres eliminar el expediente <strong>{expediente.codigo}</strong>?
          </p>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setOpenDel(false)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-danger" onClick={confirmDelete}>
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
