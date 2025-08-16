'use client';

import React, { useEffect, useState } from 'react';
import Modal from './Modal';

type ExpedienteRef = { id: number; codigo: string };
type TareaRef = { id: number; titulo: string };

type Parte = {
  id?: number;
  fecha: string;
  hora_inicio?: string;
  hora_fin?: string;
  horas?: number;
  comentario?: string;
  expediente_id?: number;
  tarea_id?: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: Partial<Parte> | null;
  expedientes: ExpedienteRef[];
  tareas: TareaRef[];
  onSubmit: (form: FormData) => Promise<void>; // server action
  submitting?: boolean;
  title?: string;
};

export default function ParteModal({
  open,
  onClose,
  initial,
  expedientes,
  tareas,
  onSubmit,
  submitting,
  title = 'Parte',
}: Props) {
  const [form, setForm] = useState<Parte>({
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    horas: 0,
    comentario: '',
    expediente_id: undefined,
    tarea_id: undefined,
  });

  useEffect(() => {
    if (initial) {
      setForm({
        id: initial.id,
        fecha: initial.fecha ?? '',
        hora_inicio: initial.hora_inicio ?? '',
        hora_fin: initial.hora_fin ?? '',
        horas: Number(initial.horas ?? 0),
        comentario: initial.comentario ?? '',
        expediente_id: initial.expediente_id,
        tarea_id: initial.tarea_id,
      });
    }
  }, [initial]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === 'horas' ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (form.id) fd.set('id', String(form.id));
    await onSubmit(fd);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid" style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
          <label>
            <div className="text-sm">Fecha</div>
            <input type="date" name="fecha" value={form.fecha ?? ''} onChange={handleChange} className="input" required />
          </label>
          <label>
            <div className="text-sm">Horas</div>
            <input type="number" step="0.25" name="horas" value={form.horas ?? 0} onChange={handleChange} className="input" />
          </label>
          <label>
            <div className="text-sm">Hora inicio</div>
            <input type="time" name="hora_inicio" value={form.hora_inicio ?? ''} onChange={handleChange} className="input" />
          </label>
          <label>
            <div className="text-sm">Hora fin</div>
            <input type="time" name="hora_fin" value={form.hora_fin ?? ''} onChange={handleChange} className="input" />
          </label>
          <label>
            <div className="text-sm">Expediente</div>
            <select name="expediente_id" value={form.expediente_id ?? ''} onChange={handleChange} className="input">
              <option value="">—</option>
              {expedientes.map((e) => (
                <option key={e.id} value={e.id}>{e.codigo}</option>
              ))}
            </select>
          </label>
          <label>
            <div className="text-sm">Tarea</div>
            <select name="tarea_id" value={form.tarea_id ?? ''} onChange={handleChange} className="input">
              <option value="">—</option>
              {tareas.map((t) => (
                <option key={t.id} value={t.id}>{t.titulo}</option>
              ))}
            </select>
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <div className="text-sm">Comentario</div>
            <textarea name="comentario" rows={3} value={form.comentario ?? ''} onChange={handleChange} className="input" />
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" onClick={onClose} className="btn-secondary">✖️</button>
          <button type="submit" disabled={submitting} className="btn-primary">{submitting ? '…' : '💾'}</button>
        </div>
      </form>
    </Modal>
  );
}
