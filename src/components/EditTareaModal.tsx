'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';

type Prioridad = 'Baja' | 'Media' | 'Alta';
type Estado = 'Pendiente' | 'En curso' | 'Completada';

export type TareaEditInput = {
  id: number;
  titulo: string;
  expediente_id: number | null;
  vencimiento?: string | null; // yyyy-mm-dd
  horas_previstas?: number | null;
  estado?: Estado;
  prioridad?: Prioridad;
  descripcion?: string | null;
};

export type MiniExpediente = { id: number; codigo: string };

type Props = {
  open: boolean;
  onClose: () => void;
  tarea: TareaEditInput | null;
  expedientes: MiniExpediente[];
  onSave: (data: TareaEditInput) => Promise<void> | void;
};

export default function EditTareaModal({ open, onClose, tarea, expedientes, onSave }: Props) {
  const [form, setForm] = useState<TareaEditInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const expOptions = useMemo(
    () => expedientes.sort((a, b) => a.codigo.localeCompare(b.codigo)),
    [expedientes]
  );

  useEffect(() => {
    if (open && tarea) {
      setForm({
        id: tarea.id,
        titulo: tarea.titulo ?? '',
        expediente_id: tarea.expediente_id ?? null,
        vencimiento: tarea.vencimiento ?? null,
        horas_previstas: tarea.horas_previstas ?? null,
        estado: (tarea.estado as Estado) ?? 'Pendiente',
        prioridad: (tarea.prioridad as Prioridad) ?? 'Media',
        descripcion: tarea.descripcion ?? null,
      });
      setErr(null);
      setBusy(false);
    }
    if (!open) setForm(null);
  }, [open, tarea]);

  if (!form) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setBusy(true);
      setErr(null);
      if (!form.titulo.trim()) throw new Error('El título es obligatorio');
      await onSave(form);
      setBusy(false);
      onClose();
    } catch (e: any) {
      setBusy(false);
      setErr(e?.message ?? 'No se pudo guardar la tarea');
    }
  }

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title="Editar tarea">
      <form onSubmit={handleSubmit} className="space-y-3">
        {err && <div className="alert error">{err}</div>}

        <div>
          <label className="lbl">Título*</label>
          <input
            className="inp"
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f!, titulo: e.target.value }))}
          />
        </div>

        <div>
          <label className="lbl">Expediente*</label>
          <select
            className="inp"
            value={form.expediente_id ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f!,
                expediente_id: e.target.value ? Number(e.target.value) : null,
              }))
            }
          >
            <option value="">— Selecciona —</option>
            {expOptions.map((x) => (
              <option key={x.id} value={x.id}>
                {x.codigo}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-2">
          <div>
            <label className="lbl">Vencimiento</label>
            <input
              type="date"
              className="inp"
              value={form.vencimiento ?? ''}
              onChange={(e) => setForm((f) => ({ ...f!, vencimiento: e.target.value || null }))}
            />
          </div>
          <div>
            <label className="lbl">Horas previstas</label>
            <input
              type="number"
              step="0.25"
              min="0"
              className="inp"
              value={form.horas_previstas ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f!,
                  horas_previstas: e.target.value === '' ? null : Number(e.target.value),
                }))
              }
            />
          </div>
        </div>

        <div className="grid grid-2">
          <div>
            <label className="lbl">Estado</label>
            <select
              className="inp"
              value={form.estado ?? 'Pendiente'}
              onChange={(e) => setForm((f) => ({ ...f!, estado: e.target.value as Estado }))}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En curso">En curso</option>
              <option value="Completada">Completada</option>
            </select>
          </div>
          <div>
            <label className="lbl">Prioridad</label>
            <select
              className="inp"
              value={form.prioridad ?? 'Media'}
              onChange={(e) => setForm((f) => ({ ...f!, prioridad: e.target.value as Prioridad }))}
            >
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
        </div>

        <div>
          <label className="lbl">Descripción</label>
          <textarea
            className="inp"
            rows={3}
            value={form.descripcion ?? ''}
            onChange={(e) => setForm((f) => ({ ...f!, descripcion: e.target.value || null }))}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className="btn primary" disabled={busy}>
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}
