'use client';

import { useMemo, useState } from 'react';
import Modal from '@/components/Modal';
import type { ExpedienteRef, TareaRef, ParteDTO } from '@/types';

export type EditPartePayload = {
  id?: number; // si es edición
  fecha: string;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  expediente_id?: number | null;
  tarea_id?: number | null;
  descripcion?: string | null;
  comentario?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  parte: ParteDTO;                 // valores iniciales
  expedientes: ExpedienteRef[];
  tareas: TareaRef[];              // <- usa el compartido (expediente_id opcional)
  onSave: (p: EditPartePayload) => void | Promise<void>;
};

const MINUTE_STEPS = ['00', '15', '30', '45'];

function buildTimeOptions() {
  const hours = Array.from({ length: 24 }, (_, h) => h);
  const out: string[] = [];
  for (const h of hours) {
    for (const m of MINUTE_STEPS) {
      const hh = String(h).padStart(2, '0');
      out.push(`${hh}:${m}`);
    }
  }
  return out;
}
const TIME_OPTIONS = buildTimeOptions();

export default function EditParteModal({
  open,
  onClose,
  parte,
  expedientes,
  tareas,
  onSave,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<EditPartePayload>(() => ({
    id: parte.id ?? undefined,
    fecha: parte.fecha ?? new Date().toISOString().slice(0, 10),
    hora_inicio: parte.hora_inicio ?? null,
    hora_fin: parte.hora_fin ?? null,
    expediente_id: parte.expediente_id ?? null,
    tarea_id: parte.tarea_id ?? null,
    descripcion: parte.descripcion ?? '',
    comentario: parte.comentario ?? '',
  }));

  const tareasFiltradas = useMemo(() => {
    if (!form.expediente_id) return tareas;
    // expediente_id es opcional en el tipo, por eso comparamos de forma segura
    return tareas.filter((t) => t.expediente_id == null || t.expediente_id === form.expediente_id);
  }, [tareas, form.expediente_id]);

  function onChange<K extends keyof EditPartePayload>(key: K, value: EditPartePayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (!form.fecha) throw new Error('La fecha es obligatoria.');
      await onSave(form);
      onClose();
    } catch (ex: any) {
      setErr(ex?.message ?? 'Error al guardar el parte.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={form.id ? 'Editar parte' : 'Nuevo parte'} widthClass="max-w-xl">
      <form onSubmit={submit} className="space-y-3">
        {/* Fecha */}
        <div>
          <label className="block text-sm mb-1">Fecha</label>
          <input
            type="date"
            className="input"
            value={form.fecha}
            onChange={(e) => onChange('fecha', e.target.value)}
            required
          />
        </div>

        {/* Expediente */}
        <div>
          <label className="block text-sm mb-1">Expediente</label>
          <select
            className="select"
            value={form.expediente_id ?? ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              onChange('expediente_id', val);
              // reset tarea si no pertenece
              if (form.tarea_id != null && val != null) {
                const ok = tareas.some((t) => t.id === form.tarea_id && (t.expediente_id == null || t.expediente_id === val));
                if (!ok) onChange('tarea_id', null);
              }
            }}
          >
            <option value="">— Selecciona expediente —</option>
            {expedientes.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.codigo}{ex.proyecto ? ` — ${ex.proyecto}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Tarea */}
        <div>
          <label className="block text-sm mb-1">Tarea (opcional)</label>
          <select
            className="select"
            value={form.tarea_id ?? ''}
            onChange={(e) => onChange('tarea_id', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">— Sin tarea —</option>
            {tareasFiltradas.map((t) => (
              <option key={t.id} value={t.id}>{t.titulo}</option>
            ))}
          </select>
        </div>

        {/* Horas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Hora inicio</label>
            <select
              className="select"
              value={form.hora_inicio ?? ''}
              onChange={(e) => onChange('hora_inicio', e.target.value || null)}
            >
              <option value="">— Sin hora —</option>
              {TIME_OPTIONS.map((t) => <option key={`ini-${t}`} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Hora fin</label>
            <select
              className="select"
              value={form.hora_fin ?? ''}
              onChange={(e) => onChange('hora_fin', e.target.value || null)}
            >
              <option value="">— Sin hora —</option>
              {TIME_OPTIONS.map((t) => <option key={`fin-${t}`} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm mb-1">Descripción</label>
          <textarea
            className="textarea"
            rows={3}
            value={form.descripcion ?? ''}
            onChange={(e) => onChange('descripcion', e.target.value)}
          />
        </div>

        {/* Comentario */}
        <div>
          <label className="block text-sm mb-1">Comentario (interno)</label>
          <textarea
            className="textarea"
            rows={2}
            value={form.comentario ?? ''}
            onChange={(e) => onChange('comentario', e.target.value)}
          />
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <div className="flex justify-end gap-2">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Guardando…' : (form.id ? 'Guardar cambios' : 'Crear parte')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
