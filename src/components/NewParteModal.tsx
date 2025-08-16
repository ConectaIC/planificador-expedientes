// src/components/NewParteModal.tsx
// Tipo: Client Component

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';

export type MiniExpediente = { id: number; codigo: string };
export type MiniTarea = { id: number; titulo: string; expediente_id: number | null };

export type ParteInput = {
  fecha: string; // yyyy-mm-dd
  hora_inicio: string; // HH:mm
  hora_fin: string;    // HH:mm
  horas?: number | null; // opcional: si no se envía, la calcula el backend
  comentario?: string | null;
  expediente_id: number | null;
  tarea_id: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  expedientes: MiniExpediente[];
  tareas: MiniTarea[];
  onCreate: (data: ParteInput) => Promise<void> | void;
};

function diffHours(hhmmA: string, hhmmB: string): number {
  if (!hhmmA || !hhmmB) return 0;
  const [h1, m1] = hhmmA.split(':').map(Number);
  const [h2, m2] = hhmmB.split(':').map(Number);
  const t1 = h1 * 60 + m1;
  const t2 = h2 * 60 + m2;
  return Math.max(0, (t2 - t1) / 60);
}

export default function NewParteModal({ open, onClose, expedientes, tareas, onCreate }: Props) {
  const [form, setForm] = useState<ParteInput>({
    fecha: new Date().toISOString().slice(0, 10),
    hora_inicio: '08:00',
    hora_fin: '09:00',
    horas: 1,
    comentario: '',
    expediente_id: null,
    tarea_id: null,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const expOptions = useMemo(
    () => expedientes.sort((a, b) => a.codigo.localeCompare(b.codigo)),
    [expedientes]
  );
  const tareasFiltradas = useMemo(
    () =>
      form.expediente_id
        ? tareas.filter((t) => t.expediente_id === form.expediente_id)
        : tareas,
    [tareas, form.expediente_id]
  );

  useEffect(() => {
    if (open) {
      setErr(null);
      setBusy(false);
    }
  }, [open]);

  // Recalcular horas al cambiar horas de inicio/fin
  useEffect(() => {
    const h = diffHours(form.hora_inicio, form.hora_fin);
    setForm((f) => ({ ...f, horas: Number(h.toFixed(2)) }));
  }, [form.hora_inicio, form.hora_fin]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setBusy(true);
      setErr(null);
      if (!form.expediente_id) throw new Error('Selecciona un expediente');
      await onCreate(form);
      setBusy(false);
      onClose();
    } catch (e: any) {
      setBusy(false);
      setErr(e?.message ?? 'No se pudo crear el parte');
    }
  }

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title="Nuevo parte">
      <form onSubmit={handleSubmit} className="space-y-3">
        {err && <div className="alert error">{err}</div>}

        <div className="grid grid-2">
          <div>
            <label className="lbl">Fecha</label>
            <input
              type="date"
              className="inp"
              value={form.fecha}
              onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
            />
          </div>
          <div>
            <label className="lbl">Expediente*</label>
            <select
              className="inp"
              value={form.expediente_id ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  expediente_id: e.target.value ? Number(e.target.value) : null,
                  // si cambiamos de expediente, limpiamos tarea
                  tarea_id: null,
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
        </div>

        <div>
          <label className="lbl">Tarea (opcional)</label>
          <select
            className="inp"
            value={form.tarea_id ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                tarea_id: e.target.value ? Number(e.target.value) : null,
              }))
            }
          >
            <option value="">— Sin tarea —</option>
            {tareasFiltradas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.titulo}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-3">
          <div>
            <label className="lbl">Inicio</label>
            <input
              type="time"
              className="inp"
              value={form.hora_inicio}
              onChange={(e) => setForm((f) => ({ ...f, hora_inicio: e.target.value }))}
            />
          </div>
          <div>
            <label className="lbl">Fin</label>
            <input
              type="time"
              className="inp"
              value={form.hora_fin}
              onChange={(e) => setForm((f) => ({ ...f, hora_fin: e.target.value }))}
            />
          </div>
          <div>
            <label className="lbl">Horas</label>
            <input className="inp" value={form.horas ?? 0} readOnly />
          </div>
        </div>

        <div>
          <label className="lbl">Comentario</label>
          <textarea
            className="inp"
            rows={3}
            value={form.comentario ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, comentario: e.target.value || null }))}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className="btn primary" disabled={busy}>
            Crear
          </button>
        </div>
      </form>
    </Modal>
  );
}
