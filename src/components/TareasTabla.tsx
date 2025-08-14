'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';

export type Tarea = {
  id: string;
  titulo: string;
  estado?: string | null;
  prioridad?: string | null;
  horas_previstas?: number | null;
  horas_realizadas?: number | null;
  vencimiento?: string | null; // ISO date o null
};

function toDateInputValue(d?: string | null) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default function TareasTabla({ tareasIniciales }: { tareasIniciales: Tarea[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [openEdit, setOpenEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<Tarea | null>(null);
  const [delId, setDelId] = useState<string | null>(null);

  const lista = useMemo(()=>{
    const src = (tareasIniciales||[]).slice();
    const qq = q.trim().toLowerCase();
    if (!qq) return src;
    return src.filter(t =>
      (t.titulo||'').toLowerCase().includes(qq) ||
      (t.estado||'').toLowerCase().includes(qq) ||
      (t.prioridad||'').toLowerCase().includes(qq)
    );
  },[tareasIniciales,q]);

  function abrirEdicion(t: Tarea){ setEditing(t); setOpenEdit(true); }
  function abrirBorrado(id: string){ setDelId(id); setOpenDel(true); }

  async function guardar(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      titulo: (fd.get('titulo') as string)?.trim(),
      estado: (fd.get('estado') as string) || null,
      prioridad: (fd.get('prioridad') as string) || null,
      horas_previstas: (()=> {
        const v = (fd.get('horas_previstas') as string)?.trim();
        return v ? Number(v) : null;
      })(),
      vencimiento: (fd.get('vencimiento') as string) || null
    };
    const res = await fetch(`/api/tareas/${editing.id}`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const j = await res.json();
    setSaving(false);
    if (!j?.ok) { alert('Error al guardar: ' + (j?.error||'desconocido')); return; }
    setOpenEdit(false); setEditing(null);
    router.refresh();
  }

  async function confirmarBorrado(){
    if (!delId) return;
    setDeleting(true);
    const res = await fetch(`/api/tareas/${delId}`, { method:'DELETE' });
    const j = await res.json();
    setDeleting(false);
    if (!j?.ok) { alert('No se pudo borrar: ' + (j?.error||'desconocido')); return; }
    setOpenDel(false); setDelId(null);
    router.refresh();
  }

  return (
    <>
      <div style={{display:'grid', gridTemplateColumns:'1fr', gap:8, margin:'8px 0'}}>
        <input placeholder="Filtrar por título, estado o prioridad" value={q} onChange={e=>setQ(e.target.value)} />
      </div>

      <section style={{overflowX:'auto'}}>
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>Vencimiento</th>
              <th>Previstas (h)</th>
              <th>Realizadas (h)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(lista||[]).map(t=>(
              <tr key={t.id}>
                <td>{t.titulo}</td>
                <td>{t.estado || '—'}</td>
                <td>{t.prioridad || '—'}</td>
                <td>{t.vencimiento ? t.vencimiento.split('T')[0].split('-').reverse().join('/') : '—'}</td>
                <td>{t.horas_previstas ?? '—'}</td>
                <td>{typeof t.horas_realizadas === 'number' ? t.horas_realizadas.toFixed(2) : (t.horas_realizadas ?? 0)}</td>
                <td style={{display:'flex', gap:8}}>
                  <button title="Editar" aria-label="Editar" onClick={()=>abrirEdicion(t)} style={{padding:'4px 6px'}}>✏️</button>
                  <button title="Borrar" aria-label="Borrar" onClick={()=>abrirBorrado(t.id)} style={{padding:'4px 6px'}}>🗑️</button>
                </td>
              </tr>
            ))}
            {!lista?.length && <tr><td colSpan={7}>Sin tareas.</td></tr>}
          </tbody>
        </table>
      </section>

      {/* Modal edición */}
      <Modal open={openEdit} onClose={()=>!saving && (setOpenEdit(false), setEditing(null))} title="Editar tarea">
        {editing && (
          <form onSubmit={guardar} style={{display:'grid', gap:10}}>
            <label>Título
              <input name="titulo" defaultValue={editing.titulo} required />
            </label>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <label>Estado
                <select name="estado" defaultValue={editing.estado ?? ''}>
                  <option value="">—</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En curso">En curso</option>
                  <option value="Entregado">Entregado</option>
                  <option value="En Supervisión">En Supervisión</option>
                  <option value="Cerrado">Cerrado</option>
                </select>
              </label>
              <label>Prioridad
                <select name="prioridad" defaultValue={editing.prioridad ?? ''}>
                  <option value="">—</option>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </label>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <label>Horas previstas
                <input name="horas_previstas" type="number" step="0.25" min="0" defaultValue={editing.horas_previstas ?? ''} />
              </label>
              <label>Vencimiento
                <input
                  name="vencimiento"
                  type="date"
                  defaultValue={toDateInputValue(editing.vencimiento)}
                />
              </label>
            </div>
            <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
              <button type="button" onClick={()=>!saving && (setOpenEdit(false), setEditing(null))}>Cancelar</button>
              <button disabled={saving} type="submit">{saving?'Guardando…':'Guardar cambios'}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal borrado */}
      <Modal open={openDel} onClose={()=>!deleting && (setOpenDel(false), setDelId(null))} title="Confirmar borrado">
        <p>¿Seguro que quieres borrar esta tarea?</p>
        <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
          <button onClick={()=>!deleting && (setOpenDel(false), setDelId(null))}>Cancelar</button>
          <button disabled={deleting} onClick={confirmarBorrado}>{deleting?'Borrando…':'Borrar definitivamente'}</button>
        </div>
      </Modal>
    </>
  );
}
