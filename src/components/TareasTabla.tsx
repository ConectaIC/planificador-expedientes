'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';

export type Tarea = {
  id: string;
  titulo: string;
  estado?: string | null;          // Pendiente | En curso | Entregado | En Supervisión | Cerrado | null
  prioridad?: string | null;       // Alta | Media | Baja | null
  horas_previstas?: number | null;
  horas_realizadas?: number | null;
  vencimiento?: string | null;     // YYYY-MM-DD
};

function fmtFechaES(d?: string | null) {
  if (!d) return '—';
  // mostramos sin new Date para evitar TZ: YYYY-MM-DD -> DD/MM/YYYY
  const ymd = d.split('T')[0];
  const [y,m,day] = ymd.split('-');
  if (!y || !m || !day) return '—';
  return `${day}/${m}/${y}`;
}
function pct(hReal?: number | null, hPrev?: number | null) {
  const r = Number(hReal || 0);
  const p = Number(hPrev || 0);
  if (!p || isNaN(p)) return '—';
  return `${Math.round((r / p) * 100)}%`;
}

export default function TareasTabla({ tareasIniciales }: { tareasIniciales: Tarea[] }) {
  const router = useRouter();

  // ordenar por vencimiento asc
  const tareas = useMemo(() => {
    const arr = (tareasIniciales || []).slice();
    arr.sort((a, b) => {
      const aa = a.vencimiento ? a.vencimiento : '9999-12-31';
      const bb = b.vencimiento ? b.vencimiento : '9999-12-31';
      return aa.localeCompare(bb);
    });
    return arr;
  }, [tareasIniciales]);

  // estado modales
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<Tarea | null>(null);
  const [saving, setSaving] = useState(false);

  const [openDel, setOpenDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delTarea, setDelTarea] = useState<Tarea | null>(null);

  // acciones
  function abrirEdicion(t: Tarea) { setEditing(t); setOpenEdit(true); }
  function abrirBorrado(t: Tarea) { setDelTarea(t); setOpenDel(true); }

  async function guardarEdicion(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!editing) return;
    setSaving(true);
    const fd = new FormData(ev.currentTarget);
    const payload = {
      titulo: (fd.get('titulo') as string).trim(),
      estado: ((fd.get('estado') as string) || '').trim() || null,
      prioridad: ((fd.get('prioridad') as string) || '').trim() || null,
      horas_previstas: (() => {
        const v = (fd.get('horas_previstas') as string).trim();
        return v ? Number(v) : null;
      })(),
      vencimiento: ((fd.get('vencimiento') as string) || '').trim() || null,
    };

    const res = await fetch(`/api/tareas/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    setSaving(false);
    if (!j?.ok) { alert('Error al guardar: ' + (j?.error || 'desconocido')); return; }
    setOpenEdit(false); setEditing(null);
    router.refresh();
  }

  async function confirmarBorrado() {
    if (!delTarea) return;
    setDeleting(true);
    const res = await fetch(`/api/tareas/${delTarea.id}`, { method: 'DELETE' });
    const j = await res.json();
    setDeleting(false);
    if (!j?.ok) { alert('No se pudo borrar: ' + (j?.error || 'desconocido')); return; }
    setOpenDel(false); setDelTarea(null);
    router.refresh();
  }

  return (
    <>
      <section style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>Vencimiento</th>
              <th>Previstas (h)</th>
              <th>Realizadas (h)</th>
              <th>%</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tareas.length ? tareas.map(t => (
              <tr key={t.id}>
                <td>{t.titulo}</td>
                <td>{t.estado ?? '—'}</td>
                <td>{t.prioridad ?? '—'}</td>
                <td>{fmtFechaES(t.vencimiento)}</td>
                <td>{typeof t.horas_previstas === 'number' ? t.horas_previstas : (t.horas_previstas ?? '—')}</td>
                <td>{typeof t.horas_realizadas === 'number' ? Number(t.horas_realizadas).toFixed(2) : (t.horas_realizadas ?? 0)}</td>
                <td>{pct(t.horas_realizadas, t.horas_previstas)}</td>
                <td style={{whiteSpace:'nowrap', display:'flex', gap:8}}>
                  <button
                    onClick={() => abrirEdicion(t)}
                    title="Editar"
                    aria-label="Editar tarea"
                    style={{padding:'4px 6px'}}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => abrirBorrado(t)}
                    title="Borrar"
                    aria-label="Borrar tarea"
                    style={{padding:'4px 6px'}}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={8}>No hay tareas registradas.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Modal edición */}
      <Modal
        open={openEdit}
        onClose={()=>!saving && (setOpenEdit(false), setEditing(null))}
        title="Editar tarea"
      >
        {editing && (
          <form onSubmit={guardarEdicion} style={{display:'grid', gap:10}}>
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
              <label>Vencimiento (YYYY-MM-DD)
                <input name="vencimiento" defaultValue={editing.vencimiento?.split('T')[0] ?? ''} placeholder="2025-09-01" />
              </label>
            </div>
            <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
              <button type="button" onClick={()=>!saving && (setOpenEdit(false), setEditing(null))}>Cancelar</button>
              <button disabled={saving} type="submit">{saving ? 'Guardando…' : 'Guardar cambios'}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal confirmación de borrado */}
      <Modal
        open={openDel}
        onClose={()=>!deleting && (setOpenDel(false), setDelTarea(null))}
        title="Confirmar borrado"
      >
        <p>¿Seguro que quieres borrar la tarea <strong>{delTarea?.titulo}</strong>?</p>
        <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
          <button onClick={()=>!deleting && (setOpenDel(false), setDelTarea(null))}>Cancelar</button>
          <button disabled={deleting} onClick={confirmarBorrado}>{deleting ? 'Borrando…' : 'Borrar definitivamente'}</button>
        </div>
      </Modal>
    </>
  );
}
