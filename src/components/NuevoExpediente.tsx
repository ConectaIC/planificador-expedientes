'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default function NuevoExpediente() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      codigo: (fd.get('codigo') as string)?.trim(),
      proyecto: (fd.get('proyecto') as string)?.trim(),
      cliente: (fd.get('cliente') as string)?.trim() || null,
      fin: ((fd.get('fin') as string) || '').trim() || null,
      prioridad: (fd.get('prioridad') as string) || null,
      estado: (fd.get('estado') as string) || null,
    };

    const res = await fetch('/api/expedientes', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    setSaving(false);
    if (!j?.ok) { alert('Error al crear: ' + (j?.error||'desconocido')); return; }
    setOpen(false);
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <>
      <button className="btn" onClick={()=>setOpen(true)}>➕ Nuevo expediente</button>
      <Modal open={open} onClose={()=>!saving && setOpen(false)} title="Nuevo expediente">
        <form onSubmit={onSubmit} style={{display:'grid', gap:10}}>
          <label>Código
            <input name="codigo" required placeholder="25.201ATG, 25.107PR…" />
          </label>
          <label>Proyecto
            <input name="proyecto" required placeholder="Descripción del proyecto" />
          </label>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <label>Cliente
              <input name="cliente" placeholder="Ayuntamiento / Privado…" />
            </label>
            <label>Fin (entrega prevista)
              <input name="fin" type="date" defaultValue="" min={todayISO()} />
            </label>
          </div>
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
