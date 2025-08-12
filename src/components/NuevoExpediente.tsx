'use client';
import { useState } from 'react';

export default function NuevoExpediente() {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  async function onSubmit(e: any) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch('/api/expedientes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    setSaving(false);
    if (j.ok) {
      setMsg('✔ Expediente creado/actualizado');
      (e.target as HTMLFormElement).reset();
      // recargar listado
      setTimeout(() => window.location.reload(), 600);
    } else {
      setMsg('Error: ' + j.error);
    }
  }

  return (
    <section style={{ marginTop: 16 }}>
      <button type="button" onClick={() => setShow(v => !v)}>
        {show ? 'Cerrar formulario' : '➕ Nuevo expediente'}
      </button>
      {show && (
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 560, marginTop: 12 }}>
          <label>Código * <input name="codigo" placeholder="25.210DT" required /></label>
          <label>Proyecto * <input name="proyecto" placeholder="Nombre del proyecto" required /></label>
          <label>Cliente <input name="cliente" placeholder="Cliente" /></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label>Fin <input type="date" name="fin" /></label>
            <label>Prioridad
              <select name="prioridad" defaultValue="">
                <option value="">—</option>
                <option>Alta</option><option>Media</option><option>Baja</option>
              </select>
            </label>
          </div>
          <label>Estado
            <select name="estado" defaultValue="En curso">
              <option>En curso</option>
              <option>Pendiente</option>
              <option>Entregado</option>
              <option>Cerrado</option>
            </select>
          </label>
          <button disabled={saving} type="submit">{saving ? 'Guardando…' : 'Guardar expediente'}</button>
          {msg && <p>{msg}</p>}
        </form>
      )}
    </section>
  );
}
