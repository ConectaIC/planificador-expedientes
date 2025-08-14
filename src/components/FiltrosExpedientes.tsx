'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';

export type Expediente = {
  id: string;
  codigo?: string | null;
  proyecto?: string | null;
  cliente?: string | null;
  fin?: string | null;        // ISO date o null
  prioridad?: string | null;
  estado?: string | null;
  horasTotales?: number;
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

export default function FiltrosExpedientes({ expedientes }: { expedientes: Expediente[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [orden, setOrden] = useState<'finAsc'|'finDesc'|'codigoAsc'|'codigoDesc'|'horasAsc'|'horasDesc'>('codigoAsc');

  const [openEdit, setOpenEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<Expediente | null>(null);
  const [delId, setDelId] = useState<string | null>(null);

  const lista = useMemo(()=>{
    let out = (expedientes||[]).slice();
    // filtro
    const qq = q.trim().toLowerCase();
    if (qq) {
      out = out.filter(e =>
        (e.codigo||'').toLowerCase().includes(qq) ||
        (e.proyecto||'').toLowerCase().includes(qq) ||
        (e.cliente||'').toLowerCase().includes(qq)
      );
    }
    // orden
    switch(orden){
      case 'codigoAsc':  out.sort((a,b)=> (a.codigo||'').localeCompare(b.codigo||'')); break;
      case 'codigoDesc': out.sort((a,b)=> (b.codigo||'').localeCompare(a.codigo||'')); break;
      case 'finAsc':     out.sort((a,b)=> (a.fin||'9999').localeCompare(b.fin||'9999')); break;
      case 'finDesc':    out.sort((a,b)=> (b.fin||'0000').localeCompare(a.fin||'0000')); break;
      case 'horasAsc':   out.sort((a,b)=> (a.horasTotales||0) - (b.horasTotales||0)); break;
      case 'horasDesc':  out.sort((a,b)=> (b.horasTotales||0) - (a.horasTotales||0)); break;
    }
    return out;
  },[expedientes,q,orden]);

  function abrirEdicion(e: Expediente){ setEditing(e); setOpenEdit(true); }
  function abrirBorrado(id: string){ setDelId(id); setOpenDel(true); }

  async function guardar(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      codigo: (fd.get('codigo') as string)?.trim(),
      proyecto: (fd.get('proyecto') as string)?.trim(),
      cliente: (fd.get('cliente') as string)?.trim() || null,
      fin: (fd.get('fin') as string) || null,
      prioridad: (fd.get('prioridad') as string) || null,
      estado: (fd.get('estado') as string) || null,
    };
    const res = await fetch(`/api/expedientes/${editing.id}`, {
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
    const res = await fetch(`/api/expedientes/${delId}`, { method:'DELETE' });
    const j = await res.json();
    setDeleting(false);
    if (!j?.ok) { alert('No se pudo borrar: ' + (j?.error||'desconocido')); return; }
    setOpenDel(false); setDelId(null);
    router.refresh();
  }

  return (
    <>
      <div className="row" style={{margin:'8px 0'}}>
        <input placeholder="Buscar por código, proyecto o cliente" value={q} onChange={e=>setQ(e.target.value)} />
        <select value={orden} onChange={e=>setOrden(e.target.value as any)}>
          <option value="codigoAsc">Orden: Código ↑</option>
          <option value="codigoDesc">Orden: Código ↓</option>
          <option value="finAsc">Orden: Fin ↑</option>
          <option value="finDesc">Orden: Fin ↓</option>
          <option value="horasAsc">Orden: Horas ↑</option>
          <option value="horasDesc">Orden: Horas ↓</option>
        </select>
      </div>

      <section style={{overflowX:'auto'}}>
        <table>
          <thead>
            <tr>
              <th>Exp.</th>
              <th>Proyecto</th>
              <th>Cliente</th>
              <th>Fin</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Horas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(e=>(
              <tr key={e.id}>
                <td><a href={`/expedientes/${encodeURIComponent(e.codigo||'')}`}>{e.codigo}</a></td>
                <td>{e.proyecto}</td>
                <td>{e.cliente || '—'}</td>
                <td>{e.fin ? e.fin.split('T')[0].split('-').reverse().join('/') : '—'}</td>
                <td>{e.prioridad || '—'}</td>
                <td>{e.estado || '—'}</td>
                <td>{(e.horasTotales ?? 0).toFixed(2)}</td>
                <td style={{display:'flex', gap:8}}>
                  <button title="Editar" aria-label="Editar" onClick={()=>abrirEdicion(e)} style={{padding:'4px 6px'}}>✏️</button>
                  <button title="Borrar" aria-label="Borrar" onClick={()=>abrirBorrado(e.id)} style={{padding:'4px 6px'}}>🗑️</button>
                </td>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={8}>Sin expedientes.</td></tr>}
          </tbody>
        </table>
      </section>

      {/* Modal edición */}
      <Modal open={openEdit} onClose={()=>!saving && (setOpenEdit(false), setEditing(null))} title="Editar expediente">
        {editing && (
          <form onSubmit={guardar} style={{display:'grid', gap:10}}>
            <div className="grid-2">
              <label>Código
                <input name="codigo" defaultValue={editing.codigo ?? ''} required />
              </label>
              <label>Proyecto
                <input name="proyecto" defaultValue={editing.proyecto ?? ''} required />
              </label>
            </div>
            <div className="grid-2">
              <label>Cliente
                <input name="cliente" defaultValue={editing.cliente ?? ''} />
              </label>
              <label>Fin (entrega prevista)
                <input
                  name="fin"
                  type="date"
                  defaultValue={toDateInputValue(editing.fin)}
                />
              </label>
            </div>
            <div className="grid-2">
              <label>Prioridad
                <select name="prioridad" defaultValue={editing.prioridad ?? ''}>
                  <option value="">—</option>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </label>
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
        <p>¿Seguro que quieres borrar este expediente?</p>
        <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
          <button onClick={()=>!deleting && (setOpenDel(false), setDelId(null))}>Cancelar</button>
          <button disabled={deleting} onClick={confirmarBorrado}>{deleting?'Borrando…':'Borrar definitivamente'}</button>
        </div>
      </Modal>
    </>
  );
}
