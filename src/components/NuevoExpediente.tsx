'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';

export default function NuevoExpediente() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    const res = await fetch('/api/expedientes', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    setSaving(false);
    if (!j?.ok) { alert('Error al crear: '+(j?.error||'desconocido')); return; }
    setOpen(false);
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <>
      <button onClick={()=>setOpen(true)}>➕ Nuevo expediente</button>
      <Modal open={open} onClose={()=>!saving && setOpen(false)} title="Nuevo expediente">
        <form onSubmit={onSubmit} style={{display:'grid', gap:10}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <label>Código
              <input name="codigo" required placeholder="25.123PR" />
            </label>
            <label>Fin (YYYY-MM-DD)
              <input name="fin" placeholder="2025-09-01" />
            </label>
          </div>
          <label>Proyecto
            <input name="proyecto" required placeholder="Descripción del proyecto" />
          </label>
          <label>Cliente
            <input name="cliente" placeholder="Cliente" />
          </label>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <label>Prioridad
              <select name="prioridad" defaultValue="">
                <option value="">—</option>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </label>
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
          </div>
          <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
            <button type="button" onClick={()=>!saving && setOpen(false)}>Cancelar</button>
            <button disabled={saving} type="submit">{saving?'Creando…':'Crear'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
