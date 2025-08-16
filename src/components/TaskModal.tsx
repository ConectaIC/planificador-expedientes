'use client';

import React, { useEffect, useState } from 'react';
import Modal from './Modal';

type Task = {
  id?: number;
  expediente_id?: number;
  titulo: string;
  horas_previstas?: number | null;
  horas_realizadas?: number | null;
  estado?: 'Pendiente' | 'En curso' | 'Completada';
  prioridad?: 'Baja' | 'Media' | 'Alta';
  vencimiento?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: Partial<Task> | null;
  onSubmit: (form: FormData) => Promise<void>; // server action
  expedienteId?: number; // para nueva tarea dentro del expediente
  title?: string;
  submitting?: boolean;
};

export default function TaskModal({
  open,
  onClose,
  initial,
  onSubmit,
  expedienteId,
  title = 'Tarea',
  submitting,
}: Props) {
  const [form, setForm] = useState<Task>({
    titulo: '',
    horas_previstas: 0,
    horas_realizadas: 0,
    estado: 'Pendiente',
    prioridad: 'Media',
    vencimiento: '',
    expediente_id: expedienteId,
  });

  useEffect(() => {
    setForm((f) => ({ ...f, expediente_id: expedienteId ?? f.expediente_id }));
  }, [expedienteId]);

  useEffect(() => {
    if (initial) {
      setForm({
        id: initial.id,
        expediente_id: initial.expediente_id ?? expedienteId,
        titulo: initial.titulo ?? '',
        horas_previstas: Number(initial.horas_previstas ?? 0),
        horas_realizadas: Number(initial.horas_realizadas ?? 0),
        estado: (initial.estado as any) ?? 'Pendiente',
        prioridad: (initial.prioridad as any) ?? 'Media',
        vencimiento: (initial.vencimiento as any) ?? '',
      });
    }
  }, [initial, expedienteId]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name.startsWith('horas_') ? Number(value) : value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (form.id) fd.set('id', String(form.id));
    if (form.expediente_id) fd.set('expediente_id', String(form.expediente_id));
    await onSubmit(fd);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid" style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
          <label style={{ gridColumn: '1 / -1' }}>
            <div className="text-sm">Título</div>
            <input name="titulo" value={form.titulo} onChange={handleChange} className="input" required />
          </label>
          <label>
            <div className="text-sm">Horas previstas</div>
            <input type="number" step="0.25" name="horas_previstas" value={form.horas_previstas ?? 0} onChange={handleChange} className="input" />
          </label>
          <label>
            <div className="text-sm">Horas realizadas</div>
            <input type="number" step="0.25" name="horas_realizadas" value={form.horas_realizadas ?? 0} onChange={handleChange} className="input" />
          </label>
          <label>
            <div className="text-sm">Estado</div>
            <select name="estado" value={form.estado ?? 'Pendiente'} onChange={handleChange} className="input">
              <option>Pendiente</option>
              <option>En curso</option>
              <option>Completada</option>
            </select>
          </label>
          <label>
            <div className="text-sm">Prioridad</div>
            <select name="prioridad" value={form.prioridad ?? 'Media'} onChange={handleChange} className="input">
              <option>Baja</option>
              <option>Media</option>
              <option>Alta</option>
            </select>
          </label>
          <label>
            <div className="text-sm">Vencimiento</div>
            <input type="date" name="vencimiento" value={form.vencimiento ?? ''} onChange={handleChange} className="input" />
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
