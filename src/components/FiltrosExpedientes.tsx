'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';

export type Expediente = {
  id: string;
  codigo: string;
  proyecto: string;
  cliente?: string | null;
  fin?: string | null;
  prioridad?: string | null;
  estado?: string | null;
  horasTotales?: number;
};

type Props = { expedientes: Expediente[] };

export default function FiltrosExpedientes({ expedientes }: Props) {
  const router = useRouter();

  // filtros
  const [query, setQuery]   = useState('');
  const [pri, setPri]       = useState<'todas'|'Alta'|'Media'|'Baja'>('todas');
  const [est, setEst]       = useState<'todos'|'Pendiente'|'En curso'|'Entregado'|'En Supervisión'|'Cerrado'>('todos');
  const [orden, setOrden]   = useState<'finAsc'|'finDesc'|'codigoAsc'|'codigoDesc'|'horasAsc'|'horasDesc'>('finAsc');

  // modal edición
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<Expediente | null>(null);
  const [saving, setSaving] = useState(false);

  // modal confirmación borrado
  const [openDel, setOpenDel] = useState(false);
  const [delExp, setDelExp] = useState<Expediente | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtrados = useMemo(() => {
    let out = (expedientes || []).slice();
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(e =>
        (e.codigo || '').toLowerCase().includes(q) ||
        (e.proyecto || '').toLowerCase().includes(q) ||
        (e.cliente || '').toLowerCase().includes(q)
      );
    }
    if (pri !== 'todas') out = out.filter(e => (e.prioridad || '').toLowerCase() === pri.toLowerCase());
    if (est !== 'todos') out = out.filter(e => (e.estado || '').toLowerCase() === est.toLowerCase());

    switch (orden) {
      case 'finAsc':     out.sort((a,b)=> (a.fin||'9999').localeCompare(b.fin||'9999')); break;
      case 'finDesc':    out.sort((a,b)=> (b.fin||'0000').localeCompare(a.fin||'0000')); break;
      case 'codigoAsc':  out.sort((a,b)=> (a.codigo||'').localeCompare(b.codigo||''));   break;
      case 'codigoDesc': out.sort((a,b)=> (b.codigo||'').localeCompare(a.codigo||''));   break;
      case 'horasAsc':   out.sort((a,b)=> (a.horasTotales||0)-(b.horasTotales||0));      break;
      case 'horasDesc':  out.sort((a,b)=> (b.horasTotales||0)-(a.horasTotales||0));      break;
    }
    return out;
  }, [expedientes, query, pri, est, orden]);

  function fmtFin(d?: string | null) {
    return d ? d.split('T')[0].split('-').reverse().join('/') : '—';
  }

  // --- Acciones ---
  function abrirEdicion(e: Expediente) { setEditing(e); setOpenEdit(true); }
  function abrirBorrado(e: Expediente) { setDelExp(e); setOpenDel(true); }

  async function guardarEdicion(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!editing) return;
    setSaving(true);
    const fd = new FormData(ev.currentTarget);
    const payload = {
      codigo: (fd.get('codigo') as string).trim(),
      proyecto: (fd.get('proyecto') as string).trim(),
      cliente: ((fd.get('cliente') as string) || '').trim() || null,
      fin: ((fd.get('fin') as string) || '').trim() || null,
      prioridad: ((fd.get('prioridad') as string) || '').trim() || null,
      estado: ((fd.get('estado') as string) || '').trim() || null,
    };
    const res = await fetch(`/api/expedientes/${editing.id}`, {
      method: 'PATCH', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    setSaving(false);
    if (!j?.ok) { alert('Error al guardar: ' + (j?.error || 'desconocido')); return; }
    setOpenEdit(false); setEditing(null);
    router.refresh();
  }

  async function confirmarBorrado() {
    if (!delExp) return;
    setDeleting(true);
    const res = await fetch(`/api/expedientes/${delExp.id}`, { method:'DELETE' });
    const j = await res.json();
    setDeleting(false);
    if (!j?.ok) { alert('No se pudo borrar: ' + (j?.error || 'desconocido')); return; }
    setOpenDel(false); setDelExp(null);
    router.refresh();
  }

  return (
    <>
      <section>
        <div style={{display:'grid', gridTemplateColumns:'1fr 200px 200px 200px', gap:8, alignItems:'center'}}>
          <input placeholder="Buscar por código, proyecto o cliente" value={query} onChange={e=>setQuery(e.target.value)} />
          <select value={pri} onChange={e=>setPri(e.target.value as any)}>
            <option value="todas">Prioridad: todas</option>
            <option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option>
          </select>
          <select value={est} onChange={e=>setEst(e.target.value as any)}>
            <option value="todos">Estado: todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En curso">En curso</option>
            <option value="Entregado">Entregado</option>
            <option value="En Supervisión">En Supervisión</option>
            <option value="Cerrado">Cerrado</option>
          </select>
          <select value={orden} onChange={e=>setOrden(e.target.value as any)}>
            <option value="finAsc">Orden: Fin ↑</option>
            <option value="finDesc">Orden: Fin ↓</option>
            <option value="codigoAsc">Orden: Código ↑</option>
            <option value="codigoDesc">Orden: Código ↓</option>
            <option value="horasAsc">Orden: Horas ↑</option>
            <option value="horasDesc">Orden: Horas ↓</option>
          </select>
        </div>

        <p style={{marginTop:6}}>Coincidencias: {filtrados.length} / {expedientes.length}</p>

        <table>
          <thead>
            <tr>
              <th>Código</th><th>Proyecto</th><th>Cliente</th><th>Fin</th>
              <th>Prioridad</th><th>Estado</th><th>Horas imputadas</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length ? filtrados.map(e => (
              <tr key={e.id}>
                <td><a href={`/expedientes/${encodeURIComponent(e.codigo)}`}>{e.codigo}</a></td>
                <td>{e.proyecto || '—'}</td>
                <td>{e.cliente || '—'}</td>
                <td>{fmtFin(e.fin)}</td>
                <td>{e.prioridad || '—'}</td>
                <td>{e.estado || '—'}</td>
                <td>{(e.horasTotales ?? 0).toFixed(2)} h</td>
                <td style={{whiteSpace:'nowrap'}}>
                  <button onClick={() => abrirEdicion(e)}>✏️ Editar</button>{' '}
                  <button onClick={() => abrirBorrado(e)}>🗑️ Borrar</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={8}>Sin expedientes.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Modal edición */}
      <Modal open={openEdit} onClose={()=>!saving && (setOpenEdit(false), setEditing(null))} title="Editar expediente">
        {editing && (
          <form onSubmit={guardarEdicion} style={{display:'grid', gap:10}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <label>Código
                <input name="codigo" defaultValue={editing.codigo} required />
              </label>
              <label>Fin (YYYY-MM-DD)
                <input name="fin" defaultValue={editing.fin?.split('T')[0] ?? ''} placeholder="2025-09-01" />
              </label>
            </div>
            <label>Proyecto
              <input name="proyecto" defaultValue={editing.proyecto} required />
            </label>
            <label>Cliente
              <input name="cliente" defaultValue={editing.cliente ?? ''} />
            </label>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <label>Prioridad
                <select name="prioridad" defaultValue={editing.prioridad ?? ''}>
                  <option value="">—</option>
                  <option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option>
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

      {/* Modal confirmación de borrado */}
      <Modal open={openDel} onClose={()=>!deleting && (setOpenDel(false), setDelExp(null))} title="Confirmar borrado">
        <p>¿Seguro que quieres borrar el expediente <strong>{delExp?.codigo}</strong>?
          {` `}
          {`(Si tiene tareas/partes asociados puede fallar por restricciones de BD).`}
        </p>
        <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
          <button onClick={()=>!deleting && (setOpenDel(false), setDelExp(null))}>Cancelar</button>
          <button disabled={deleting} onClick={confirmarBorrado}>{deleting?'Borrando…':'Borrar definitivamente'}</button>
        </div>
      </Modal>
    </>
  );
}
