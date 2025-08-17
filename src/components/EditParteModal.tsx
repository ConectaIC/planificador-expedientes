// src/components/EditParteModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/Modal';

type ExpedienteRef = { id: number; codigo: string; proyecto?: string | null };
type TareaRef = { id: number; titulo: string; expediente_id: number };

export type ParteDTO = {
  id: number;
  expediente_id: number | null;
  tarea_id: number | null;
  fecha: string;        // YYYY-MM-DD
  hora_inicio: string;  // HH:mm
  hora_fin: string;     // HH:mm
  horas: number | null; // calculadas en DB, pero permitimos mostrar
  comentario: string;
};

export type EditPartePayload = {
  id?: number;
  expediente_id: number | null;
  tarea_id: number | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  comentario: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  parte: ParteDTO;
  expedientes: ExpedienteRef[];
  tareas: TareaRef[];
  onSave: (p: EditPartePayload) => void | Promise<void>;
  title?: string; // <-- añadido para resolver el error de tipos
};

const HOUR_STEPS = Array.from({ length: 24 }, (_, h) => h)
  .flatMap((h) => [0, 15, 30, 45].map((m) => ({ h, m })))
  .map(({ h, m }) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

export default function EditParteModal({
  open,
  onClose,
  parte,
  expedientes,
  tareas,
  onSave,
  title = 'Parte',
}: Props) {
  const [form, setForm] = useState<ParteDTO>(parte);

  useEffect(() => {
    setForm(parte);
  }, [parte, open]);

  const tareasFiltradas = useMemo(() => {
    if (!form.expediente_id) return [];
    return (tareas || []).filter((t) => t.expediente_id === form.expediente_id);
  }, [tareas, form.expediente_id]);

  function update<K extends keyof ParteDTO>(key: K, value: ParteDTO[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toQuarter(value: string) {
    // Normaliza a múltiplos de 15 minutos
    const [hh, mm] = value.split(':').map((x) => parseInt(x, 10));
    const quarters = [0, 15, 30, 45];
    const nearest =
      quarters.reduce((prev, cur) =>
        Math.abs(cur - mm) < Math.abs(prev - mm) ? cur : prev
      );
    return `${String(hh).padStart(2, '0')}:${String(nearest).padStart(2, '0')}`;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: EditPartePayload = {
      id: form.id || undefined,
      expediente_id: form.expediente_id ?? null,
      tarea_id: form.tarea_id ?? null,
      fecha: form.fecha,
      hora_inicio: toQuarter(form.hora_inicio),
      hora_fin: toQuarter(form.hora_fin),
      comentario: form.comentario || '',
    };
    await onSave(payload);
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={submit} className="space-y-3">
        {/* Expediente */}
        <div className="form-row">
          <label className="form-label">Expediente</label>
          <select
            className="form-input"
            value={form.expediente_id ?? ''}
            onChange={(e) =>
              update('expediente_id', e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">— Selecciona expediente —</option>
            {(expedientes || []).map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.codigo} {ex.proyecto ? `— ${ex.proyecto}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Tarea */}
        <div className="form-row">
          <label className="form-label">Tarea</label>
          <select
            className="form-input"
            value={form.tarea_id ?? ''}
            onChange={(e) =>
              update('tarea_id', e.target.value ? Number(e.target.value) : null)
            }
            disabled={!form.expediente_id}
          >
            <option value="">— Selecciona tarea —</option>
            {tareasFiltradas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.titulo}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha */}
        <div className="form-row">
          <label className="form-label">Fecha</label>
          <input
            type="date"
            className="form-input"
            value={form.fecha}
            onChange={(e) => update('fecha', e.target.value)}
          />
        </div>

        {/* Hora inicio / fin */}
        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="form-label">Hora inicio</label>
            <select
              className="form-input"
              value={form.hora_inicio}
              onChange={(e) => update('hora_inicio', toQuarter(e.target.value))}
            >
              {HOUR_STEPS.map((h) => (
                <option key={`ini-${h}`} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Hora fin</label>
            <select
              className="form-input"
              value={form.hora_fin}
              onChange={(e) => update('hora_fin', toQuarter(e.target.value))}
            >
              {HOUR_STEPS.map((h) => (
                <option key={`fin-${h}`} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comentario */}
        <div className="form-row">
          <label className="form-label">Comentario</label>
          <textarea
            className="form-input"
            rows={3}
            value={form.comentario}
            onChange={(e) => update('comentario', e.target.value)}
            placeholder="Descripción breve del parte…"
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}
