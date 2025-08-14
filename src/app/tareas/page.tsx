export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function TareasGlobalPage() {
  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from('tareas')
    .select(`
      id, titulo, estado, prioridad, horas_previstas, horas_realizadas, vencimiento,
      expedientes:expediente_id ( codigo, proyecto )
    `)
    .order('vencimiento', { ascending: true });

  if (error) {
    return <main><h2>Tareas</h2><p>Error al cargar: {error.message}</p></main>;
  }

  return (
    <main>
      <h2>Todas las tareas</h2>
      <FiltrosTareas tareas={data || []} />
    </main>
  );
}

/* --- Componente simple integrado para filtrar (sin archivo aparte) --- */
'use client';
import { useMemo, useState } from 'react';

function fmt(d?: string|null){ return d ? d.split('T')[0].split('-').reverse().join('/') : '—'; }

function FiltrosTareas({ tareas }: { tareas: any[] }) {
  const [q, setQ] = useState('');
  const [est, setEst] = useState<'todos'|'Pendiente'|'En curso'|'Entregado'|'En Supervisión'|'Cerrado'>('todos');
  const [pri, setPri] = useState<'todas'|'Alta'|'Media'|'Baja'>('todas');
  const [orden, setOrden] = useState<'vtoAsc'|'vtoDesc'|'priAsc'|'priDesc'>('vtoAsc');

  const lista = useMemo(()=>{
    let out = (tareas||[]).slice();
    const qq = q.trim().toLowerCase();
    if (qq) {
      out = out.filter(t =>
        (t.titulo||'').toLowerCase().includes(qq) ||
        (t.expedientes?.codigo||'').toLowerCase().includes(qq) ||
        (t.expedientes?.proyecto||'').toLowerCase().includes(qq)
      );
    }
    if (est!=='todos') out = out.filter(t => (t.estado||'').toLowerCase()===est.toLowerCase());
    if (pri!=='todas') out = out.filter(t => (t.prioridad||'').toLowerCase()===pri.toLowerCase());

    switch(orden){
      case 'vtoAsc':  out.sort((a,b)=> (a.vencimiento||'9999').localeCompare(b.vencimiento||'9999')); break;
      case 'vtoDesc': out.sort((a,b)=> (b.vencimiento||'0000').localeCompare(a.vencimiento||'0000')); break;
      case 'priAsc':  out.sort((a,b)=> (a.prioridad||'zzz').localeCompare(b.prioridad||'zzz')); break;
      case 'priDesc': out.sort((a,b)=> (b.prioridad||'').localeCompare(a.prioridad||'')); break;
    }
    return out;
  },[tareas,q,est,pri,orden]);

  return (
    <>
      <div style={{display:'grid', gridTemplateColumns:'1fr 180px 180px 180px', gap:8, alignItems:'center'}}>
        <input placeholder="Buscar por título, expediente o proyecto" value={q} onChange={e=>setQ(e.target.value)} />
        <select value={est} onChange={e=>setEst(e.target.value as any)}>
          <option value="todos">Estado: todos</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En curso">En curso</option>
          <option value="Entregado">Entregado</option>
          <option value="En Supervisión">En Supervisión</option>
          <option value="Cerrado">Cerrado</option>
        </select>
        <select value={pri} onChange={e=>setPri(e.target.value as any)}>
          <option value="todas">Prioridad: todas</option>
          <option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option>
        </select>
        <select value={orden} onChange={e=>setOrden(e.target.value as any)}>
          <option value="vtoAsc">Orden: Vto ↑</option>
          <option value="vtoDesc">Orden: Vto ↓</option>
          <option value="priAsc">Orden: Prioridad ↑</option>
          <option value="priDesc">Orden: Prioridad ↓</option>
        </select>
      </div>

      <p style={{marginTop:6}}>Coincidencias: {lista.length} / {tareas.length}</p>

      <section style={{overflowX:'auto'}}>
        <table>
          <thead>
            <tr>
              <th>Exp.</th>
              <th>Proyecto</th>
              <th>Título</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>Vencimiento</th>
              <th>Previstas (h)</th>
              <th>Realizadas (h)</th>
            </tr>
          </thead>
          <tbody>
            {lista.length ? lista.map((t:any)=>(
              <tr key={t.id}>
                <td><a href={`/expedientes/${encodeURIComponent(t.expedientes?.codigo||'')}`}>{t.expedientes?.codigo || '—'}</a></td>
                <td>{t.expedientes?.proyecto || '—'}</td>
                <td>{t.titulo}</td>
                <td>{t.estado || '—'}</td>
                <td>{t.prioridad || '—'}</td>
                <td>{fmt(t.vencimiento)}</td>
                <td>{t.horas_previstas ?? '—'}</td>
                <td>{typeof t.horas_realizadas === 'number' ? t.horas_realizadas.toFixed(2) : (t.horas_realizadas ?? 0)}</td>
              </tr>
            )) : (
              <tr><td colSpan={8}>Sin tareas.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
