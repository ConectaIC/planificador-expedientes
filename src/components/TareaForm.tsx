// src/components/TareaForm.tsx
'use client';

import React from 'react';
import { createTarea, updateTarea } from '../app/tareas/actions';

type Expediente = { id: number; codigo: string; proyecto?: string | null };
type Tarea = {
  id?: number;
  titulo?: string;
  expediente_id?: number;
  descripcion?: string | null;
  vencimiento?: string | null;
  horas_previstas?: number | null;
  estado?: string | null;
  tipo?: string | null;
};

type Props = {
  expedientes: Expediente[];
  initial?: Tarea;         // si viene, es edición
  onSaved?: () => void;
};

export default function TareaForm({ expedientes, initial, onSaved }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setMsg('');
    const fd = new FormData(e.currentTarget);
    const res = initial?.id ? await updateTarea(fd) : await createTarea(fd);
    setLoading(false);
    if (res.ok) {
      setMsg('Guardado correctamente');
      onSaved?.();
    } else {
      setMsg(`Error: ${res.error}`);
    }
  }

  const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 };
  const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };
  const input: React.CSSProperties = { border: '1px solid #ddd', borderRadius: 6, padding: 8 };
  const actions: React.CSSProperties = { marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' };
  const btn: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 8, border: '1px solid var(--cic-border, #dcdcdc)',
    background: 'var(--cic-primary-bg, #eef4ff)', cursor: 'pointer',
  };

  return (
    <form onSubmit={onSubmit}>
      {initial?.id && <input type="hidden" name="id" defaultValue={String(initial.id)} />}
      <div style={row}>
        <div style={col}>
          <label>Título*</label>
          <input name="titulo" required defaultValue={initial?.titulo || ''} style={input} />
        </div>
        <div style={col}>
          <label>Expediente*</label>
          <select name="expediente_id" required defaultValue={initial?.expediente_id || ''} style={input}>
            <option value="">— Selecciona —</option>
            {expedientes.map((e) => (
              <option key={e.id} value={e.id}>{e.codigo} {e.proyecto ? `— ${e.proyecto}` : ''}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ ...row, marginTop: 8 }}>
        <div style={col}>
          <label>Vencimiento</label>
          <input name="vencimiento" type="date" defaultValue={initial?.vencimiento || ''} style={input} />
        </div>
        <div style={col}>
          <label>Horas previstas</label>
          <input name="horas_previstas" type="number" step="0.25" defaultValue={initial?.horas_previstas ?? ''} style={input} />
        </div>
      </div>

      <div style={{ ...row, marginTop: 8 }}>
        <div style={col}>
          <label>Estado</label>
          <input name="estado" placeholder="pendiente / en curso / completada" defaultValue={initial?.estado || ''} style={input} />
        </div>
        <div style={col}>
          <label>Tipo</label>
          <input name="tipo" placeholder="productiva / no productiva" defaultValue={initial?.tipo || ''} style={input} />
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <label>Descripción</label>
        <textarea name="descripcion" rows={3} defaultValue={initial?.descripcion || ''} style={{ ...input, width: '100%' }} />
      </div>

      <div style={actions}>
        <button type="submit" disabled={loading} style={btn}>
          {loading ? 'Guardando…' : (initial?.id ? 'Guardar cambios' : 'Crear tarea')}
        </button>
      </div>

      {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
    </form>
  );
}
