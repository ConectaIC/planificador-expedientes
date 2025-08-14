'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';

type ExpedienteOpt = { id: string; codigo?: string|null; proyecto?: string|null };
type Parte = {
  id: string;
  fecha: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  horas: number | null;
  comentario: string | null;
  expediente_id: string | null;
  tarea_id?: string | null;
};

function calcHours(inicio?: string|null, fin?: string|null) {
  if (!inicio || !fin) return 0;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  if ([h1,m1,h2,m2].some(n => Number.isNaN(n))) return 0;
  const t1 = h1*60 + m1;
  const t2 = h2*60 + m2;
  const diff = t2 - t1;
  if (diff <= 0) return 0;
  return Math.round((diff/60) * 4) / 4;
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}

export default function PartesUI({
  expedientes,
  partesIniciales,
  mapTareaTitulos,
}:{
  expedientes: ExpedienteOpt[];
  partesIniciales: Parte[];
  mapTareaTitulos: Record<string,string>;
}) {
  const router = useRouter();

  // ---------- Formulario alta ----------
  const [fecha, setFecha] = useState<string>(todayISO());
  const [inicio, setInicio] = useState<string>('');
  const [fin, setFin] = useState<string>('');
  const [exp, setExp] = useState<string>('');
  const [tarea, setTarea] = useState<string>('');
  const [comentario, setComentario] = useState<string>('');
  const horas = useMemo(()=>calcHours(inicio,fin),[inicio,fin]);

  // tareas del expediente seleccionado
  const [tareasOpt, setTareasOpt] = useState<{id:string; titulo:string}[]>([]);
  useEffect(()=>{
    setTarea('');
    if (!exp) { setTareasOpt([]); return; }
    // intenta /api/tareas?expediente_id=...
    fetch(`/api/tareas?expediente_id=${encodeURIComponent(exp)}`)
      .then(r=>r.ok ? r.json() : Promise.reject())
      .then(j=>{
        if (j?.ok && Array.isArray(j.data)) setTareasOpt(j.data);
        else setTareasOpt([]);
      })
      .catch(()=>setTareasOpt([]));
  },[exp]);

  async function crearParte(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/partes', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        fecha,
        inicio: inicio || null,
        fin: fin || null,
        horas,
        comentario: comentario || null,
        expediente_id: exp || null,
        tarea_id: tarea || null,
      })
    });
    const j = await res.json();
    if (!j?.ok) { alert('Error al crear: ' + (j?.error||'desconocido')); return; }
    // reset rápido
    setInicio(''); setFin(''); setComentario('');
    router.refresh();
  }

  // ---------- Listado + editar/borrar ----------
  const [editing, setEditing] = useState<Parte|null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [delId, setDelId] = useState<string| null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // mapas auxiliares
  const mapExp = useMemo(()=>{
    const m = new Map<string,ExpedienteOpt>();
    (expedientes||[]).forEach(e=>m.set(e.id, e));
    return m;
  },[expedientes]);

  function fmtDate(d?: string|null) {
    if (!d) return '—';
    const s = d.split('T')[0];
    const [yy,mm,dd] = s.split('-');
    return `${dd}/${mm}/${yy}`;
  }
  function fmtTime(t?: string|null) { return t ? t.slice(0,5) : '—'; }

  function abrirEdicion(p: Parte) { setEditing(p); setOpenEdit(true); }
  function abrirBorrado(id: string){ setDelId(id); setOpenDel(true); }

  async function guardarParte(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      fecha: (fd.get('fecha') as string)||null,
      inicio: (fd.get('inicio') as string)||null,
      fin: (fd.get('fin') as string)||null,
      comentario: (fd.get('comentario') as string)||null,
      expediente_id: (fd.get('expediente_id') as string)||null,
      tarea_id: (fd.get('tarea_id') as string)||null,
    };
    const res = await fetch(`/api/partes/${editing.id}`, {
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
    const res = await fetch(`/api/partes/${delId}`, { method:'DELETE' });
    const j = await res.json();
    setDeleting(false);
    if (!j?.ok) { alert('No se pudo borrar: ' + (j?.error||'desconocido')); return; }
    setOpenDel(false); setDelId(null);
    router.refresh();
  }

  return (
    <>
      {/* FORM ALTA */}
      <form onSubmit={crearParte} style={{display:'grid', gap:10, margin:'8px 0 16px'}}>
        <div className="grid-3">
          <label>Fecha
            <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} />
          </label>
          <label>Inicio
            <input type="time" step={900} value={inicio} onChange={e=>setInicio(e.target.value)} />
          </label>
          <label>Fin
            <input type="time" step={900} value={fin} onChange={e=>setFin(e.target.value)} />
          </label>
        </div>
        <div className="grid-2">
          <label>Expediente
            <select value={exp} onChange={e=>setExp(e.target.value)}>
              <option value="">— Selecciona expediente —</option>
              {(expedientes||[]).map(e=>(
                <option key={e.id} value={e.id}>
                  {(e.codigo||'')} {e.proyecto ? ` — ${e.proyecto}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label>Tarea (opcional)
            <select value={tarea} onChange={e=>setTarea(e.target.value)} disabled={!exp}>
              <option value="">— Sin asignar a tarea —</option>
              {tareasOpt.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
            </select>
          </label>
        </div>
        <div className="grid-2">
          <label>Horas (auto)
            <input value={horas.toFixed(2)} readOnly />
          </label>
          <label>Comentario
            <textarea value={comentario} onChange={e=>setComentario(e.target.value)} rows={3} />
          </label>
        </div>
        <div style={{display:'flex', justifyContent:'flex-end'}}>
          <button type="submit" className="btn">Guardar</button>
        </div>
      </form>

      {/* LISTADO */}
      <section style={{overflowX:'auto'}}>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Expediente</th>
              <th>Tarea</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Horas</th>
              <th>Comentario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(partesIniciales||[]).map(p=>{
              const ex = p.expediente_id ? mapExp.get(p.expediente_id) : undefined;
              const tareaTit = p.tarea_id ? mapTareaTitulos[p.tarea_id] : undefined;
              return (
                <tr key={p.id}>
                  <td>{fmtDate(p.fecha)}</td>
                  <td>{ex ? `${ex.codigo||''}${ex.proyecto ? ' — '+ex.proyecto : ''}` : '—'}</td>
                  <td>{tareaTit || '—'}</td>
                  <td>{fmtTime(p.hora_inicio)}</td>
                  <td>{fmtTime(p.hora_fin)}</td>
                  <td>{typeof p.horas === 'number' ? p.horas.toFixed(2) : (p.horas ?? '—')}</td>
                  <td>{p.comentario || '—'}</td>
                  <td style={{display:'flex', gap:8}}>
                    <button title="Editar" aria-label="Editar" onClick={()=>abrirEdicion(p)} style={{padding:'4px 6px'}}>✏️</button>
                    <button title="Borrar" aria-label="Borrar" onClick={()=>abrirBorrado(p.id)} style={{padding:'4px 6px'}}>🗑️</button>
                  </td>
                </tr>
              );
            })}
            {(!partesIniciales || partesIniciales.length===0) && (
              <tr><td colSpan={8}>Sin partes registrados.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* MODAL EDICIÓN */}
      <Modal open={openEdit} onClose={()=>!saving && (setOpenEdit(false), setEditing(null))} title="Editar parte">
        {editing && (
          <form onSubmit={guardarParte} style={{display:'grid', gap:10}}>
            <div className="grid-3">
              <label>Fecha
                <input name="fecha" type="date" defaultValue={editing.fecha ? editing.fecha.split('T')[0] : ''} />
              </label>
              <label>Inicio
                <input name="inicio" type="time" step={900} defaultValue={editing.hora_inicio || ''} />
              </label>
              <label>Fin
                <input name="fin" type="time" step={900} defaultValue={editing.hora_fin || ''} />
              </label>
            </div>
            <div className="grid-2">
              <label>Expediente
                <select name="expediente_id" defaultValue={editing.expediente_id || ''}>
                  <option value="">—</option>
                  {(expedientes||[]).map(e=>(
                    <option key={e.id} value={e.id}>
                      {(e.codigo||'')}{e.proyecto ? ` — ${e.proyecto}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>Tarea (opcional)
                <input name="tarea_id" placeholder="(sin cambios: deja vacío)" defaultValue={editing.tarea_id || ''} />
              </label>
            </div>
            <label>Comentario
              <textarea name="comentario" rows={3} defaultValue={editing.comentario || ''} />
            </label>
            <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
              <button type="button" onClick={()=>!saving && (setOpenEdit(false), setEditing(null))}>Cancelar</button>
              <button disabled={saving} type="submit">{saving ? 'Guardando…' : 'Guardar cambios'}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL BORRADO */}
      <Modal open={openDel} onClose={()=>!deleting && (setOpenDel(false), setDelId(null))} title="Confirmar borrado">
        <p>¿Seguro que quieres borrar este parte?</p>
        <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
          <button onClick={()=>!deleting && (setOpenDel(false), setDelId(null))}>Cancelar</button>
          <button disabled={deleting} onClick={confirmarBorrado}>{deleting ? 'Borrando…' : 'Borrar definitivamente'}</button>
        </div>
      </Modal>
    </>
  );
}
