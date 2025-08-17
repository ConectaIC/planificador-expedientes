'use client';

import React, { useMemo, useState } from 'react';
import { createParte } from '../app/partes/actions';

type Expediente = { id: number; codigo: string; proyecto?: string | null };
type Tarea = { id: number; titulo: string; expediente_id: number };

type ParteDTO = {
  id: number;
  fecha: string; // YYYY-MM-DD
  hora_inicio?: string | null; // HH:MM o ISO
  hora_fin?: string | null;    // HH:MM o ISO
  expediente_id?: number | null;
  tarea_id?: number | null;
  descripcion?: string | null;
  comentario?: string | null;
};

type Props = {
  expedientes: Expediente[];
  tareas: Tarea[];
  parte: ParteDTO;         // valores por defecto (para crear suele venir un stub)
  onCreated?: () => void;  // callback tras crear OK
};

const MINUTE_STEPS = ['00', '15', '30', '45'];

/** Utilidad para componer HH:MM con saltos de 15 min */
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

export default function ParteForm({ expedientes, tareas, parte, onCreated }: Props) {
  const [mensaje, setMensaje] = useState<string>('');
  const [busy, setBusy] = useState(false);

  // Estado del formulario (controlado)
  const [form, setForm] = useState<ParteDTO>(() => ({
    id: parte.id ?? 0,
    fecha: parte.fecha ?? new Date().toISOString().slice(0, 10),
    hora_inicio: parte.hora_inicio ?? null,
    hora_fin: parte.hora_fin ?? null,
    expediente_id: parte.expediente_id ?? null,
    tarea_id: parte.tarea_id ?? null,
    descripcion: parte.descripcion ?? '',
    comentario: parte.comentario ?? '',
  }));

  // Filtra tareas por expediente seleccionado (si hay)
  const tareasFiltradas = useMemo(() => {
    if (!form.expediente_id) return tareas;
    return tareas.filter((t) => t.expediente_id === form.expediente_id);
  }, [tareas, form.expediente_id]);

  function onChange<K extends keyof ParteDTO>(key: K, value: ParteDTO[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensaje('');
    setBusy(true);
    try {
      // Montamos FormData para la server action
      const fd = new FormData();
      fd.set('fecha', form.fecha || '');
      if (form.hora_inicio) fd.set('hora_inicio', form.hora_inicio);
      if (form.hora_fin) fd.set('hora_fin', form.hora_fin);
      if (form.expediente_id != null) fd.set('expediente_id', String(form.expediente_id));
      if (form.tarea_id != null) fd.set('tarea_id', String(form.tarea_id));
      if (form.descripcion) fd.set('descripcion', form.descripcion);
      if (form.comentario) fd.set('comentario', form.comentario);

      const res = await createParte(fd); // { ok: boolean; id: number|null }

      if (res.ok) {
        setMensaje('Parte creado correctamente.');
        onCreated?.();
        // Opcional: limpiar horas/descripcion tras crear
        setForm((f) => ({
          ...f,
          hora_inicio: null,
          hora_fin: null,
          descripcion: '',
          comentario: '',
        }));
      } else {
        // La acción ya lanza throw en caso de error; si llegamos aquí, mensaje genérico
        setMensaje('No se pudo crear el parte.');
      }
    } catch (err: any) {
      setMensaje(err?.message || 'Error inesperado al crear el parte.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {/* Fecha */}
      <div>
        <label className="block text-sm mb-1">Fecha</label>
        <input
          type="date"
          name="fecha"
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
            // Si cambia de expediente y la tarea seleccionada no pertenece, reseteamos tarea
            if (val && form.tarea_id) {
              const tOk = tareas.some((t) => t.id === form.tarea_id && t.expediente_id === val);
              if (!tOk) onChange('tarea_id', null);
            }
          }}
        >
          <option value="">— Selecciona expediente —</option>
          {expedientes.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.codigo}
              {ex.proyecto ? ` — ${ex.proyecto}` : ''}
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
            <option key={t.id} value={t.id}>
              {t.titulo}
            </option>
          ))}
        </select>
      </div>

      {/* Hora inicio / fin con pasos de 15 minutos */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Hora inicio</label>
          <select
            className="select"
            value={form.hora_inicio ?? ''}
            onChange={(e) => onChange('hora_inicio', e.target.value || null)}
          >
            <option value="">— Sin hora —</option>
            {TIME_OPTIONS.map((t) => (
              <option key={`ini-${t}`} value={t}>
                {t}
              </option>
            ))}
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
            {TIME_OPTIONS.map((t) => (
              <option key={`fin-${t}`} value={t}>
                {t}
              </option>
            ))}
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
          placeholder="¿Qué has hecho?"
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

      {/* Mensaje */}
      {mensaje && <p className="text-sm text-emerald-700">{mensaje}</p>}

      <div className="flex justify-end gap-2">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar parte'}
        </button>
      </div>
    </form>
  );
}
