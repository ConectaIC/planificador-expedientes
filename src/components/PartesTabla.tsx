'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';

export type Parte = {
  id: string;
  fecha: string;          // YYYY-MM-DD
  inicio: string;         // HH:MM
  fin: string;            // HH:MM
  horas: number;          // decimal
  expediente_id?: string | null;
  tarea_id?: string | null;
  comentario?: string | null;
  expediente?: { codigo?: string|null } | null; // opcional si join
  tarea?: { titulo?: string|null } | null;      // opcional si join
};

function toHoursDiff(inicio: string, fin: string) {
  // ambos "HH:MM"
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fin.split(':').map(Number);
  const start = hi*60 + mi;
  const end   = hf*60 + mf;
  const diffM = Math.max(0, end - start);
  return Math.round((diffM/60)*4)/4; // redondeo a 0.25
}

function timeOptions15() {
  const opts: string[] = [];
  for (let h=0; h<24; h++) {
    for (let m of [0,15,30,45]) {
      const hh = String(h).padStart(2,'0');
      const mm = String(m).padStart(2,'0');
      opts.push(`${hh}:${mm}`);
    }
  }
  return opts;
}
const TIME_OPTS = timeOptions15();

export default function PartesTabla({ partesIniciales, expedientes, tareasPorExpediente }:{
  partesIniciales: Parte[];
  expedientes: { id:string; codigo:string }[];
  tareasPorExpediente: Record<string, { id:string; titulo:string }[]>;
}) {
  const router = useRouter();
  const [fil, setFil] = useState(''); // filtro texto simple
  const [openEdit, setOpenEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<Parte | null>(null);
  const [delParte, setDelParte] = useState<Parte | null>(null);

  const partes = useMemo(()=>{
    const p = (partesIniciales||[]).slice().sort((a,b)=>
      (b.fecha||'').localeCompare(a.fecha||'') || (b.inicio||'').localeCompare(a.inicio||'')
    );
    const q = fil.trim().toLowerCase();
    if (!q) return p;
    return p.filter(x =>
      (x.comentario||'').toLowerCase().includes(q) ||
      (x.expediente?.codigo||'').toLowerCase().includes(q) ||
      (x.tarea?.titulo||'').toLowerCase().includes(q)
    );
  },[partesIniciales, fil]);

  function abrirEdicion(p: Parte) { setEditing(p); setOpenEdit(true); }
  function abrirBorrado(p: Parte)  { setDelParte(p); setOpenDel(true); }

  async function guardarEdicion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const expediente_id = (fd.get('expediente_id') as string)||'';
    const tarea_id      = (fd.get('tarea_id') as string)||'';
    const inicio = fd.get('inicio') as string;
    const fin    = fd.get('fin') as string;

    const payload = {
      fecha: (fd.get('fecha') as string)||editing.fecha,
      inicio, fin,
      horas: toHoursDiff(inicio, fin),
      expediente_id: expediente_id || null,
      tarea_id: tarea_id || null,
      comentario: (fd.get('comentario') as string)||''
    };

    const res = await fetch(`/api/partes/${editing.id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const j = await res.json();
    setSaving(false);
    if (!j?.ok) { alert('Error al guardar: ' + (j?.error||'desconocido')); return; }
    setOpenEdit(false); setEditing(null);
    router.refresh();
  }

  async function confirmarBorrado() {
    if (!delParte) return;
    setDeleting(true);
    const res = await fetch(`/api/partes/${delParte.id}`, { method:'DELETE' });
    const j = await res.json();
    setDeleting(false);
    if (!j?.ok) { alert('No se pudo borrar: ' + (j?.error||'desconocido')); return; }
    setOpenDel(false); setDelParte(null);
    router.refresh();
  }

  // dependencia: selector de tareas cambia según expediente seleccionado (en modal)
  const [expSel, setExpSel] = useState<string>('');
  const tareasOpt = useMemo(()=> tareasPorExpediente[expSel||''] || [], [tareasPorExpediente, expSel]);

  useEffect(()=>{
    if (editing?.expediente_id) setExpSel(editing.expediente_id);
  },[editing]);

  return (
    <>
      <div style={{display:'grid', gridTemplateColumns:'1fr', gap:8, marginBottom:8}}>
        <input placeholder="Filtrar por comentario, expediente o título de tarea" value={fil} onChange={e=>setFil(e.target.value)} />
      </div>

      <section style={{overflowX:'auto'}}>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Horas</th>
              <th>Expediente</th>
              <th>Tarea</th>
              <th>Comentario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {partes.length ? partes.map(p=>(
              <tr key={p.id}>
                <td>{p.fecha}</td>
                <td>{p.inicio}</td>
                <td>{p.fin}</td>
                <td>{Number(p.horas||0).toFixed(2)}</td>
                <td>{p.expediente?.codigo || '—'}</td>
                <td>{p.tarea?.titulo || '—'}</td>
                <td>{p.comentario || '—'}</td>
                <td style={{whiteSpace:'nowrap', display:'flex', gap:8}}>
                  <button title="Editar" aria-label="Editar" onClick={()=>abrirEdicion(p)} style={{padding:'4px 6px'}}>✏️</button>
                  <button title="Borrar" aria-label="Borrar" onClick={()=>abrirBorrado(p)} style={{padding:'4px 6px'}}>🗑️</button>
                </td>
              </tr>
            )):(
              <tr><td colSpan={8}>Sin partes.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Modal edición */}
      <Modal open={openEdit} onClose={()=>!saving && (setOpenEdit(false), setEditing(null))} title="Editar parte">
        {editing && (
          <form onSubmit={guardarEdicion} style={{display:'grid', gap:10}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
              <label>Fecha
                <input name="fecha" defaultValue={editing.fecha} />
              </label>
              <label>Inicio
                <select name="inicio" defaultValue={editing.inicio} onChange={(ev)=>{
                  // auto-recalc al cambiar - lo recalculamos en el submit
                }}>
                  {TIME_OPTS.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>Fin
                <select name="fin" defaultValue={editing.fin}>
                  {TIME_OPTS.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <label>Expediente
                <select
                  name="expediente_id"
                  defaultValue={editing.expediente_id ?? ''}
                  onChange={(e)=> setExpSel(e.target.value)}
                >
                  <option value="">—</option>
                  {expedientes.map(x=> <option key={x.id} value={x.id}>{x.codigo}</option>)}
                </select>
              </label>
              <label>Tarea
                <select name="tarea_id" defaultValue={editing.tarea_id ?? ''}>
                  <option value="">—</option>
                  {tareasOpt.map(t=> <option key={t.id} value={t.id}>{t.titulo}</option>)}
                </select>
              </label>
            </div>

            <label>Comentario
              <textarea name="comentario" defaultValue={editing.comentario ?? ''} rows={3} />
            </label>

            <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
              <button type="button" onClick={()=>!saving && (setOpenEdit(false), setEditing(null))}>Cancelar</button>
              <button disabled={saving} type="submit">{saving?'Guardando…':'Guardar cambios'}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal borrado */}
      <Modal open={openDel} onClose={()=>!deleting && (setOpenDel(false), setDelParte(null))} title="Confirmar borrado">
        <p>¿Seguro que quieres borrar este parte del <strong>{delParte?.fecha}</strong> ({delParte?.inicio}–{delParte?.fin})?</p>
        <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
          <button onClick={()=>!deleting && (setOpenDel(false), setDelParte(null))}>Cancelar</button>
          <button disabled={deleting} onClick={confirmarBorrado}>{deleting?'Borrando…':'Borrar definitivamente'}</button>
        </div>
      </Modal>
    </>
  );
}
