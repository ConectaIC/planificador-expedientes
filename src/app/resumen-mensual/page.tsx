// src/app/resumen-mensual/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth()+1, 0);
  return { start: ymd(start), end: ymd(end) };
}

export default async function ResumenMensualPage() {
  const sb = supabaseAdmin();
  const { start, end } = currentMonthRange();

  const { data: partes, error: errPartes } = await sb
    .from('partes')
    .select(`
      id, fecha, horas,
      expedientes ( id, codigo, proyecto, cliente, categoria_indirecta ),
      tarea:tarea_id ( titulo )
    `)
    .gte('fecha', start)
    .lte('fecha', end);

  if (errPartes) {
    return <main><h2>Resumen mensual</h2><p>Error al cargar partes: {errPartes.message}</p></main>;
  }

  const { data: tareasAll, error: errT } = await sb
    .from('tareas')
    .select(`
      id, titulo, estado, prioridad, horas_previstas, horas_realizadas, vencimiento,
      expedientes ( codigo, proyecto, cliente )
    `);

  if (errT) {
    return <main><h2>Resumen mensual</h2><p>Error al cargar tareas: {errT.message}</p></main>;
  }

  const { data: exps, error: errExps } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto, cliente, fin, estado, prioridad, categoria_indirecta');

  if (errExps) {
    return <main><h2>Resumen mensual</h2><p>Error al cargar expedientes: {errExps.message}</p></main>;
  }

  const activos = (exps || []).filter(e => {
    const st = (e.estado ?? '').toLowerCase();
    return st !== 'entregado' && st !== 'cerrado';
  });

  const num = (x:any) => (typeof x === 'number' ? x : Number(x || 0));
  const sum = (ns:number[]) => ns.reduce((a,b)=>a+b,0);

  const horasTotalesMes = sum((partes||[]).map(p => num(p.horas)));

  const horasIndirectas = { GEST:0, RRSS:0, ADMON:0, FORM:0 };
  let horasProductivas = 0;

  (partes||[]).forEach(p => {
    const h = num(p.horas);
    const cat = p.expedientes?.categoria_indirecta || null;
    if (cat && (cat in horasIndirectas)) {
      // @ts-ignore
      horasIndirectas[cat] += h;
    } else {
      horasProductivas += h;
    }
  });

  const esVisita = (s?: string|null) => {
    if (!s) return false;
    const t = s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
    return t.includes('visita');
  };
  const horasVisitas = sum((partes||[])
    .filter(p => esVisita(p.tarea?.titulo))
    .map(p => num(p.horas)));

  type Row = { expedienteId:string, codigo:string, proyecto:string, cliente:string, horas:number };
  const mapHoras = new Map<string, Row>();
  (partes||[]).forEach(p => {
    const e = p.expedientes;
    if (!e) return;
    const id = e.id as string;
    const prev = mapHoras.get(id) || { expedienteId:id, codigo:e.codigo||'—', proyecto:e.proyecto||'—', cliente:e.cliente||'—', horas:0 };
    prev.horas += num(p.horas);
    mapHoras.set(id, prev);
  });
  const topExpedientes = Array.from(mapHoras.values())
    .sort((a,b)=>b.horas - a.horas)
    .slice(0,10);

  const { start: mStart, end: mEnd } = { start, end };
  const tareasCompletadasMes = (tareasAll || []).filter(t => {
    const comp = (t.estado ?? '').toLowerCase() === 'completada';
    if (!comp) return false;
    const v = (t.vencimiento || '').slice(0,10);
    return v && v >= mStart && v <= mEnd;
  });

  const tareasAbiertas = (tareasAll || []).filter(t => (t.estado ?? '').toLowerCase() !== 'completada');
  const abiertasPorPrioridad = { Alta:0, Media:0, Baja:0, Sin:0 };
  tareasAbiertas.forEach(t => {
    const pr = (t.prioridad ?? '').toLowerCase();
    if (pr==='alta') abiertasPorPrioridad.Alta++;
    else if (pr==='media') abiertasPorPrioridad.Media++;
    else if (pr==='baja') abiertasPorPrioridad.Baja++;
    else abiertasPorPrioridad.Sin++;
  });

  const proximasEntregas = (activos||[])
    .filter(e => {
      const f = (e.fin || '').slice(0,10);
      return f && f >= start && f <= end;
    })
    .sort((a,b)=>(a.fin||'').localeCompare(b.fin||''));

  const visitas = (tareasAll || [])
    .filter(t => esVisita(t.titulo))
    .map(t => ({
      id: t.id,
      titulo: t.titulo,
      codigo: t.expedientes?.codigo || '—',
      proyecto: t.expedientes?.proyecto || '—',
      cliente: t.expedientes?.cliente || '—',
    }));

  // Estilos inline
  const cardStyle: React.CSSProperties = { background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:12 };
  const gridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12, margin:'12px 0' };
  const tblStyle: React.CSSProperties = { width:'100%', borderCollapse:'separate', borderSpacing:'0 6px', marginTop:8 };
  const thStyle: React.CSSProperties = { fontWeight:600, textAlign:'left', padding:'6px 10px' };
  const tdStyle: React.CSSProperties = { background:'#fff', padding:'10px', borderTop:'1px solid #eef1f5', borderBottom:'1px solid #eef1f5' };
  const linkStyle: React.CSSProperties = { color:'var(--cic-primary)' };

  return (
    <main>
      <h2>Resumen mensual</h2>
      <p>Período: <b>{start}</b> a <b>{end}</b></p>

      <section style={gridStyle}>
        <div style={cardStyle}><div style={{fontSize:'.9rem',color:'#6b7280'}}>Horas totales (mes)</div><div style={{fontSize:'1.4rem',fontWeight:700}}>{horasTotalesMes.toFixed(2)}</div></div>
        <div style={cardStyle}><div style={{fontSize:'.9rem',color:'#6b7280'}}>Horas productivas</div><div style={{fontSize:'1.4rem',fontWeight:700}}>{horasProductivas.toFixed(2)}</div></div>
        <div style={cardStyle}><div style={{fontSize:'.9rem',color:'#6b7280'}}>Visitas de obra (h)</div><div style={{fontSize:'1.4rem',fontWeight:700}}>{horasVisitas.toFixed(2)}</div></div>
        <div style={cardStyle}><div style={{fontSize:'.9rem',color:'#6b7280'}}>Tareas completadas</div><div style={{fontSize:'1.4rem',fontWeight:700}}>{(tareasCompletadasMes||[]).length}</div></div>
        <div style={cardStyle}><div style={{fontSize:'.9rem',color:'#6b7280'}}>Tareas abiertas</div><div style={{fontSize:'1.4rem',fontWeight:700}}>{(tareasAbiertas||[]).length}</div></div>
        <div style={cardStyle}><div style={{fontSize:'.9rem',color:'#6b7280'}}>Exp. activos</div><div style={{fontSize:'1.4rem',fontWeight:700}}>{(activos||[]).length}</div></div>
      </section>

      <section style={gridStyle}>
        <div style={cardStyle}><div style={{fontSize:'.9rem',color:'#6b7280'}}>GEST (h)</div><div style={{fontSize:'1.4rem',fontWeight:700}}>{horasIndirectas.GEST.toFixed(2)}</div></div>
        <div style={cardStyle}><div style={{fontSize:'.9rem',color:'#6b7280'}}>RRSS (h)</div><div style={{fontSize:'1.4rem',fontWeight:700}}>{horasIndirectas.RRSS.toFixed(2)}</div></div>
        <div style={cardStyle}><div style={{fontSize:'.9rem',color:'#6b7280'}}>ADMON (h)</div><div style={{fontSize:'1.4rem',fontWeight:700}}>{horasIndirectas.ADMON.toFixed(2)}</div></div>
        <div style={cardStyle}><div style={{fontSize:'.9rem',color:'#6b7280'}}>FORM (h)</div><div style={{fontSize:'1.4rem',fontWeight:700}}>{horasIndirectas.FORM.toFixed(2)}</div></div>
      </section>

      <h3 style={{marginTop:16}}>Top expedientes por horas del mes</h3>
      <table style={tblStyle}>
        <thead><tr><th style={thStyle}>Código</th><th style={thStyle}>Proyecto</th><th style={thStyle}>Cliente</th><th style={thStyle}>Horas</th></tr></thead>
        <tbody>
          {topExpedientes.map(r=>(
            <tr key={r.expedienteId}>
              <td style={tdStyle}><a href={`/expedientes/${encodeURIComponent(r.codigo)}`} style={linkStyle}>{r.codigo}</a></td>
              <td style={tdStyle}>{r.proyecto}</td>
              <td style={tdStyle}>{r.cliente}</td>
              <td style={tdStyle}>{r.horas.toFixed(2)}</td>
            </tr>
          ))}
          {!topExpedientes.length && <tr><td colSpan={4} style={{...tdStyle, textAlign:'center', opacity:.7}}>—</td></tr>}
        </tbody>
      </table>

      <h3 style={{marginTop:16}}>Tareas abiertas por prioridad</h3>
      <table style={tblStyle}>
        <thead><tr><th style={thStyle}>Alta</th><th style={thStyle}>Media</th><th style={thStyle}>Baja</th><th style={thStyle}>Sin prioridad</th></tr></thead>
        <tbody>
          <tr>
            <td style={tdStyle}>{abiertasPorPrioridad.Alta}</td>
            <td style={tdStyle}>{abiertasPorPrioridad.Media}</td>
            <td style={tdStyle}>{abiertasPorPrioridad.Baja}</td>
            <td style={tdStyle}>{abiertasPorPrioridad.Sin}</td>
          </tr>
        </tbody>
      </table>

      <h3 style={{marginTop:16}}>Próximas entregas (este mes)</h3>
      <table style={tblStyle}>
        <thead><tr><th style={thStyle}>Código</th><th style={thStyle}>Proyecto</th><th style={thStyle}>Cliente</th><th style={thStyle}>Fin</th><th style={thStyle}>Prioridad</th><th style={thStyle}>Estado</th></tr></thead>
        <tbody>
          {proximasEntregas.map(e=>(
            <tr key={e.id}>
              <td style={tdStyle}><a href={`/expedientes/${encodeURIComponent(e.codigo || '')}`} style={linkStyle}>{e.codigo || '—'}</a></td>
              <td style={tdStyle}>{e.proyecto || '—'}</td>
              <td style={tdStyle}>{e.cliente || '—'}</td>
              <td style={tdStyle}>{e.fin || '—'}</td>
              <td style={tdStyle}>{e.prioridad || '—'}</td>
              <td style={tdStyle}>{e.estado || '—'}</td>
            </tr>
          ))}
          {!proximasEntregas.length && <tr><td colSpan={6} style={{...tdStyle, textAlign:'center', opacity:.7}}>—</td></tr>}
        </tbody>
      </table>

      <h3 style={{marginTop:16}}>Visitas de obra (tareas detectadas)</h3>
      <table style={tblStyle}>
        <thead><tr><th style={thStyle}>Tarea</th><th style={thStyle}>Código</th><th style={thStyle}>Proyecto</th><th style={thStyle}>Cliente</th></tr></thead>
        <tbody>
          {visitas.map(v=>(
            <tr key={v.id}>
              <td style={tdStyle}>{v.titulo}</td>
              <td style={tdStyle}><a href={`/expedientes/${encodeURIComponent(v.codigo)}`} style={linkStyle}>{v.codigo}</a></td>
              <td style={tdStyle}>{v.proyecto}</td>
              <td style={tdStyle}>{v.cliente}</td>
            </tr>
          ))}
          {!visitas.length && <tr><td colSpan={4} style={{...tdStyle, textAlign:'center', opacity:.7}}>—</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
