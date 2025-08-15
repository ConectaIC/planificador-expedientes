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

  // PARTES del mes con join a expediente y a tarea (para detectar "visita")
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

  // TAREAS (para abiertas/completadas y próximas)
  const { data: tareasAll, error: errT } = await sb
    .from('tareas')
    .select(`
      id, titulo, estado, prioridad, horas_previstas, horas_realizadas, vencimiento,
      expedientes ( codigo, proyecto, cliente )
    `);

  if (errT) {
    return <main><h2>Resumen mensual</h2><p>Error al cargar tareas: {errT.message}</p></main>;
  }

  // EXPEDIENTES (para activos y próximas entregas)
  const { data: exps, error: errExps } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto, cliente, fin, estado, prioridad, categoria_indirecta');

  if (errExps) {
    return <main><h2>Resumen mensual</h2><p>Error al cargar expedientes: {errExps.message}</p></main>;
  }

  // Activos: no "Entregado" ni "Cerrado"
  const activos = (exps || []).filter(e => {
    const st = (e.estado ?? '').toLowerCase();
    return st !== 'entregado' && st !== 'cerrado';
  });

  // ---- CÁLCULOS ----
  const num = (x:any) => (typeof x === 'number' ? x : Number(x || 0));
  const sum = (ns:number[]) => ns.reduce((a,b)=>a+b,0);

  const horasTotalesMes = sum((partes||[]).map(p => num(p.horas)));

  // INDIRECTAS por categoría (según expediente)
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

  // HORAS DE VISITAS: partes con tarea.titulo que contenga "visita"
  const esVisita = (s?: string|null) => {
    if (!s) return false;
    const t = s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
    return t.includes('visita');
  };
  const horasVisitas = sum((partes||[])
    .filter(p => esVisita(p.tarea?.titulo))
    .map(p => num(p.horas)));

  // Top expedientes por horas del mes
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

  // Tareas completadas en el mes (aproximación por vencimiento hasta tener fecha_completado)
  const { start: mStart, end: mEnd } = { start, end };
  const tareasCompletadasMes = (tareasAll || []).filter(t => {
    const comp = (t.estado ?? '').toLowerCase() === 'completada';
    if (!comp) return false;
    const v = (t.vencimiento || '').slice(0,10);
    return v && v >= mStart && v <= mEnd;
  });

  // Tareas abiertas por prioridad
  const tareasAbiertas = (tareasAll || []).filter(t => (t.estado ?? '').toLowerCase() !== 'completada');
  const abiertasPorPrioridad = { Alta:0, Media:0, Baja:0, Sin:0 };
  tareasAbiertas.forEach(t => {
    const pr = (t.prioridad ?? '').toLowerCase();
    if (pr==='alta') abiertasPorPrioridad.Alta++;
    else if (pr==='media') abiertasPorPrioridad.Media++;
    else if (pr==='baja') abiertasPorPrioridad.Baja++;
    else abiertasPorPrioridad.Sin++;
  });

  // Próximas entregas (expedientes activos con fin dentro del mes)
  const proximasEntregas = (activos||[])
    .filter(e => {
      const f = (e.fin || '').slice(0,10);
      return f && f >= start && f <= end;
    })
    .sort((a,b)=>(a.fin||'').localeCompare(b.fin||''));

  // (Opcional) Listado de "Visitas de obra" detectadas por tarea
  const visitas = (tareasAll || [])
    .filter(t => esVisita(t.titulo))
    .map(t => ({
      id: t.id,
      titulo: t.titulo,
      codigo: t.expedientes?.codigo || '—',
      proyecto: t.expedientes?.proyecto || '—',
      cliente: t.expedientes?.cliente || '—',
    }));

  return (
    <main>
      <h2>Resumen mensual</h2>
      <p>Período: <b>{start}</b> a <b>{end}</b></p>

      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,margin:'12px 0'}}>
        <div className="card"><div className="k">Horas totales (mes)</div><div className="v">{horasTotalesMes.toFixed(2)}</div></div>
        <div className="card"><div className="k">Horas productivas</div><div className="v">{horasProductivas.toFixed(2)}</div></div>
        <div className="card"><div className="k">Visitas de obra (h)</div><div className="v">{horasVisitas.toFixed(2)}</div></div>
        <div className="card"><div className="k">Tareas completadas</div><div className="v">{(tareasCompletadasMes||[]).length}</div></div>
        <div className="card"><div className="k">Tareas abiertas</div><div className="v">{(tareasAbiertas||[]).length}</div></div>
        <div className="card"><div className="k">Exp. activos</div><div className="v">{(activos||[]).length}</div></div>
      </section>

      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,margin:'12px 0'}}>
        <div className="card"><div className="k">GEST (h)</div><div className="v">{horasIndirectas.GEST.toFixed(2)}</div></div>
        <div className="card"><div className="k">RRSS (h)</div><div className="v">{horasIndirectas.RRSS.toFixed(2)}</div></div>
        <div className="card"><div className="k">ADMON (h)</div><div className="v">{horasIndirectas.ADMON.toFixed(2)}</div></div>
        <div className="card"><div className="k">FORM (h)</div><div className="v">{horasIndirectas.FORM.toFixed(2)}</div></div>
      </section>

      <h3 style={{marginTop:16}}>Top expedientes por horas del mes</h3>
      <table className="tbl">
        <thead><tr><th>Código</th><th>Proyecto</th><th>Cliente</th><th>Horas</th></tr></thead>
        <tbody>
          {topExpedientes.map(r=>(
            <tr key={r.expedienteId}>
              <td><a href={`/expedientes/${encodeURIComponent(r.codigo)}`}>{r.codigo}</a></td>
              <td>{r.proyecto}</td>
              <td>{r.cliente}</td>
              <td>{r.horas.toFixed(2)}</td>
            </tr>
          ))}
          {!topExpedientes.length && <tr><td colSpan={4} style={{textAlign:'center',opacity:.7}}>—</td></tr>}
        </tbody>
      </table>

      <h3 style={{marginTop:16}}>Tareas abiertas por prioridad</h3>
      <table className="tbl">
        <thead><tr><th>Alta</th><th>Media</th><th>Baja</th><th>Sin prioridad</th></tr></thead>
        <tbody>
          <tr>
            <td>{abiertasPorPrioridad.Alta}</td>
            <td>{abiertasPorPrioridad.Media}</td>
            <td>{abiertasPorPrioridad.Baja}</td>
            <td>{abiertasPorPrioridad.Sin}</td>
          </tr>
        </tbody>
      </table>

      <h3 style={{marginTop:16}}>Próximas entregas (este mes)</h3>
      <table className="tbl">
        <thead><tr><th>Código</th><th>Proyecto</th><th>Cliente</th><th>Fin</th><th>Prioridad</th><th>Estado</th></tr></thead>
        <tbody>
          {proximasEntregas.map(e=>(
            <tr key={e.id}>
              <td><a href={`/expedientes/${encodeURIComponent(e.codigo || '')}`}>{e.codigo || '—'}</a></td>
              <td>{e.proyecto || '—'}</td>
              <td>{e.cliente || '—'}</td>
              <td>{e.fin || '—'}</td>
              <td>{e.prioridad || '—'}</td>
              <td>{e.estado || '—'}</td>
            </tr>
          ))}
          {!proximasEntregas.length && <tr><td colSpan={6} style={{textAlign:'center',opacity:.7}}>—</td></tr>}
        </tbody>
      </table>

      <h3 style={{marginTop:16}}>Visitas de obra (tareas detectadas)</h3>
      <table className="tbl">
        <thead><tr><th>Tarea</th><th>Código</th><th>Proyecto</th><th>Cliente</th></tr></thead>
        <tbody>
          {visitas.map(v=>(
            <tr key={v.id}>
              <td>{v.titulo}</td>
              <td><a href={`/expedientes/${encodeURIComponent(v.codigo)}`}>{v.codigo}</a></td>
              <td>{v.proyecto}</td>
              <td>{v.cliente}</td>
            </tr>
          ))}
          {!visitas.length && <tr><td colSpan={4} style={{textAlign:'center',opacity:.7}}>—</td></tr>}
        </tbody>
      </table>

      <style jsx>{`
        .card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:12px}
        .k{font-size:.9rem;color:#6b7280}
        .v{font-size:1.4rem;font-weight:700}
        .tbl{width:100%;border-collapse:separate;border-spacing:0 6px;margin-top:8px}
        thead th{font-weight:600;text-align:left;padding:6px 10px}
        tbody td{background:#fff;padding:10px;border-top:1px solid #eef1f5;border-bottom:1px solid #eef1f5}
        a{color:var(--cic-primary)}
      `}</style>
    </main>
  );
}
