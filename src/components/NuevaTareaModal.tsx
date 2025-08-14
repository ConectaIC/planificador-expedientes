'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';

export default function NuevaTareaModal({ expedienteId }: { expedienteId: string }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      expediente_id: expedienteId,
      titulo: (fd.get('titulo') as string).trim(),
      estado: ((fd.get('estado') as string) || '').trim() || null,
      prioridad: ((fd.get('prioridad') as string) || '').trim() || null,
      horas_previstas: (() => {
        const v = (fd.get('horas_previstas') as string).trim();
        return v ? Number(v) : null;
      })(),
      vencimiento: ((fd.get('vencimiento') as string) || '').trim() || null,
    };

    const res = await fetch('/api/tareas', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    setSaving(false);
    if (!j?.ok) { alert('Error al crear: ' + (j?.error || 'desconocido')); return; }
    setOpen(false);
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <>
      <button onClick={()=>setOpen(true)} title="Nueva tarea" aria-label="Nueva tarea" style={{padding:'4px 6px'}}>➕</button>
      <Modal open={open} onClose={()=>!saving && setOpen(false)} title="Nueva tarea">
        <form onSubmit={onSubmit} style={{display:'grid', gap:10}}>
          <label>Título
            <input name="titulo" required placeholder="Definir alcance, redactar memoria…" />
          </label>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <label>Estado
              <select name="estado" defaultValue="">
                <option value="">—</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En curso">En curso</option>
                <option value="Entregado">Entregado</option>
                <option value="En Supervisión">En Supervisión</option>
                <option value="Cerrado">Cerrado</option>
              </select>
            </label>
            <label>Prioridad
              <select name="prioridad" defaultValue="">
                <option value="">—</option>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </label>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <label>Horas previstas
              <input name="horas_previstas" type="number" step="0.25" min="0" placeholder="6" />
            </label>
            <label>Vencimiento (YYYY-MM-DD)
              <input name="vencimiento" placeholder="2025-09-01" />
            </label>
          </div>
          <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
            <button type="button" onClick={()=>!saving && setOpen(false)}>Cancelar</button>
            <button disabled={saving} type="submit">{saving ? 'Creando…' : 'Crear'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
