'use client';
import { useState } from 'react';

export default function NuevaTarea({ codigo }: { codigo: string }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  async function onSubmit(e: any) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const form = new FormData(e.currentTarget);
    form.set('codigo', codigo); // inyectamos el expediente
    const payload = Object.fromEntries(form.entries());
    const res = await fetch('/api/tareas', { method: 'POST', body: JSON.stringify(payload) });
    const j = await res.json();
    setSaving(false);
    if (j.ok) {
      setMsg('✔ Tarea creada');
      (e.target as HTMLFormElement).reset();
      setTimeout(() => window.location.reload(), 600);
    } else {
      setMsg('Error: ' + j.error);
    }
  }

  return (
    <section style={{ marginTop: 16 }}>
      <button type="button" onClick={() => setShow(v => !v)}>
        {show ? 'Cerrar formulario' : '➕ Nueva tarea'}
      </button>
      {show && (
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 560, marginTop: 12 }}>
          <label>Título * <input name="titulo" required placeholder="p.ej. Planos (3 uds.)" /></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label>Horas previstas <input type="number" step="0.25" min="0" name="horas_previstas" /></label>
            <label>Prioridad
              <select name="prioridad" defaultValue="">
                <option value="">—</option>
                <option>Alta</option><option>Media</option><option>Baja</option>
              </select>
            </label>
          </div>
          <label>Vencimiento <input type="date" name="vencimiento" /></label>
          <label>Notas <textarea name="notas" rows={3} /></label>
          <button disabled={saving} type="submit">{saving ? 'Guardando…' : 'Guardar tarea'}</button>
          {msg && <p>{msg}</p>}
        </form>
      )}
    </section>
  );
}
