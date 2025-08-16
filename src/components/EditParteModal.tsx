// src/components/EditParteModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Modal from '@/components/Modal';

type SelectOpt = { id: number; codigo?: string; titulo?: string; label?: string };

export default function EditParteModal(props: any) {
  const open: boolean = props.open ?? props.isOpen ?? false;
  const onClose: () => void = props.onClose ?? (() => {});
  const onSubmit: (payload: any) => Promise<void> | void = props.onSubmit ?? (() => {});
  const title: string = props.title ?? 'Parte';

  const parte = props.parte ?? {};
  const expedientes: SelectOpt[] = props.expedientes ?? [];
  const tareas: SelectOpt[] = props.tareas ?? [];

  const [fecha, setFecha] = useState<string>('');
  const [horaInicio, setHoraInicio] = useState<string>('');
  const [horaFin, setHoraFin] = useState<string>('');
  const [comentario, setComentario] = useState<string>('');
  const [expedienteId, setExpedienteId] = useState<number | ''>('');
  const [tareaId, setTareaId] = useState<number | ''>('');

  useEffect(() => {
    if (!open) return;
    setFecha(parte.fecha ?? '');
    setHoraInicio(parte.hora_inicio ?? '');
    setHoraFin(parte.hora_fin ?? '');
    setComentario(parte.comentario ?? '');
    setExpedienteId(parte.expediente_id ?? '');
    setTareaId(parte.tarea_id ?? '');
  }, [open, parte]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      id: parte.id,
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      comentario,
      expediente_id: expedienteId === '' ? null : Number(expedienteId),
      tarea_id: tareaId === '' ? null : Number(tareaId),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Fecha</label>
          <input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="block text-sm mb-1">Hora inicio</label>
            <input type="time" className="input" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Hora fin</label>
            <input type="time" className="input" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Expediente</label>
          <select
            className="input"
            value={expedienteId}
            onChange={(e) => setExpedienteId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">—</option>
            {expedientes.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.codigo ?? ex.label ?? ex.id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Tarea</label>
          <select
            className="input"
            value={tareaId}
            onChange={(e) => setTareaId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">—</option>
            {tareas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.titulo ?? t.label ?? t.id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Comentario</label>
          <textarea className="input" rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)} />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary" title="Cancelar">
            ✖
          </button>
          <button type="submit" className="btn-primary" title="Guardar">
            💾
          </button>
        </div>
      </form>
    </Modal>
  );
}
