// src/components/ParteForm.tsx
'use client';

import React from 'react';
import { createParte } from '../app/partes/actions';

type Expediente = { id: number; codigo: string; proyecto?: string | null };
type Tarea = { id: number; titulo: string; expediente_id: number };

type Props = {
  expedientes: Expediente[];
  tareas: Tarea[];
  onCreated?: () => void;
};

export default function ParteForm({ expedientes, tareas, onCreated }: Props) {
  const [expedienteId, setExpedienteId] = React.useState<number | ''>('');
  const [mensaje, setMensaje] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);

  const tareasFiltradas = React.useMemo(
    () => tareas.filter((t) => (expedienteId ? t.expediente_id === expedienteId : true)),
    [tareas, expedienteId]
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMensaje('');
    const form = new FormData(e.currentTarget);
    const res = await createParte(form);
    setLoading(false);
    if (res.ok) {
      setMensaje('Parte creado correctamente');
      (e.currentTarget as HTMLFormElement).reset();
      setExpedienteId('');
      onCreated?.();
    } else {
      setMensaje(`Error: ${res.error}`);
    }
  }

  const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 };
  const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };
  const input: React.CSSProperties = { border: '1px solid #ddd', borderRadius: 6, padding: 8 };
  const actions: React.CSSProperties = { marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' };
  const btn: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--cic-border, #dcdcdc)',
    background: 'var(--cic-primary-bg, #f0f5ff)',
    cursor: 'pointer',
  };
  const note: React.CSSProperties = { marginTop: 8, fontSize: '.9rem', opacity: .85 };

  return (
    <form onSubmit={onSubmit}>
      <div style={row}>
        <div style={col}>
          <label>Fecha*</label>
          <input name="fecha" type="date" required style={input} />
        </div>
        <div style={col}>
          <label>Expediente*</label>
          <select
            name="expediente_id"
            required
            style={input}
            value={expedienteId}
            onChange={(e) => setExpedienteId(Number(e.target.value) || '')}
          >
            <option value="">— Selecciona —</option>
            {expedientes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.codigo} {e.proyecto ? `— ${e.proyecto}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ ...row, marginTop: 8 }}>
        <div style={col}>
          <label>Tarea*</label>
          <select name="tarea_id" required style={input}>
            <option value="">— Selecciona —</option>
            {tareasFiltradas.map((t) => (
              <option key={t.id} value={t.id}>{t.titulo}</option>
            ))}
          </select>
          <div style={note}>El listado se filtra automáticamente por el expediente seleccionado.</div>
        </div>
        <div style={col}>
          <label>Comentario</label>
          <input name="comentario" placeholder="Opcional" style={input} />
        </div>
      </div>

      <div style={{ ...row, marginTop: 8 }}>
        <div style={col}>
          <label>Inicio*</label>
          <input name="inicio" type="time" required style={input} />
        </div>
        <div style={col}>
          <label>Fin*</label>
          <input name="fin" type="time" required style={input} />
        </div>
      </div>

      <div style={actions}>
        <button type="submit" disabled={loading} style={btn}>
          {loading ? 'Guardando…' : 'Guardar parte'}
        </button>
      </div>

      {mensaje && <div style={{ marginTop: 8 }}>{mensaje}</div>}
    </form>
  );
}
