// src/app/resumen-diario/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function rangeUltimosDias(dias: number) {
  const hoy = new Date();
  const start = new Date(hoy);
  start.setDate(hoy.getDate() - dias + 1);
  return { start: ymd(start), end: ymd(hoy) };
}

export default async function ResumenDiarioPage() {
  const sb = supabaseAdmin();
  const { start, end } = rangeUltimosDias(4); // últimos 3-4 días

  // PARTES últimos días
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
    return <main><h2>Resumen diario</h2><p>Error al cargar partes: {errPartes.message}</p></main>;
  }

  // TAREAS pendientes y próximas
  const hoy = ymd(new Date());
  const fechaLimite = ymd(new Date(new Date().setDate(new Date().getDate() + 10))); // próximas 2 semanas

  const { data: tareasPend, error: errT } = await sb
    .from('tareas')
    .select(`
      id, titulo, estado, prioridad, vencimiento,
      expedientes ( codigo, proyecto, cliente )
    `)
    .or(`estado.ilike.%pendiente%,estado.ilike.%en curso%`);

  if (errT) {
    return <main><h2>Resumen diario</h2><p>Error al cargar tareas: {errT.message}</p></main>;
  }

  // EXPEDIENTES con entregas próximas
  const { data: exps, error: errExps } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto, cliente, fin, estado, prioridad')
    .neq('estado', 'Entregado')
    .neq('estado', 'Cerrado');

  if (errExps) {
    return <main><h2>Resumen diario</h2><p>Error al cargar expedientes: {errExps.message}</p></main>;
  }

  // ---- CÁLCULOS ----
  const num = (x: any) => (typeof x === 'number' ? x : Number(x || 0));
  const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);

  // Horas totales últimos días
  const horasTotales = sum((partes || []).map(p => num(p.horas)));

  // Horas de visitas detectadas
  const esVisita = (s?: string | null) => {
    if (!s) return false;
    const t = s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    return t.includes('visita');
  };
  const horasVisitas = sum((partes || [])
    .filter(p => esVisita(p.tarea?.titulo))
    .map(p => num(p.horas)));

  // Próximas tareas
  const proximasTareas = (tareasPend || [])
    .filter(t => {
      const v = (t.vencimiento || '').slice(0, 10);
      return v && v >= hoy && v <= fechaLimite;
    })
    .sort((a, b) => (a.vencimiento || '').localeCompare(b.vencimiento || ''));

  // Próximas entregas de expedientes
  const proximasEntregas = (exps || [])
    .filter(e => {
      const f = (e.fin || '').slice(0, 10);
      return f && f >= hoy && f <= fechaLimite;
    })
    .sort((a, b) => (a.fin || '').localeCompare(b.fin || ''));

  return (
    <main>
      <h2>Resumen diario</h2>
      <p>Últimos días: <b>{start}</b> a <b>{end}</b></p>

      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,margin:'12px 0'}}>
        <div className="card"><div className="k">Horas totales</div><div className="v">{horasTotales.toFixed(2)}</div></div>
        <div className="card"><div className="k">Visitas de obra (h)</div><div className="v">{horasVisitas.toFixed(2)}</div></div>
        <div className="card"><div className="k">Próximas tareas</div><div className="v">{(proximasTareas||[]).length}</div></div>
        <div className="card"><div className="k">Próximas entregas</div><div className="v">{(proximasEntregas||[]).length}</div></div>
      </section>

      <h3 style={{marginTop:16}}>Próximas tareas (10 días)</h3>
      <table className="tbl">
        <thead><tr><th>Vencimiento</th><th>Título</th><th>Expediente</th><th>Cliente</th><th>Prioridad</th></tr></thead>
        <tbody>
          {proximasTareas.map(t=>(
            <tr key={t.id}>
              <td>{t.vencimiento || '—'}</td>
              <td>{t.titulo}</td>
              <td><a href={`/expedientes/${encodeURIComponent(t.expedientes?.codigo || '')}`}>{t.expedientes?.codigo || '—'}</a></td>
              <td>{t.expedientes?.cliente || '—'}</td>
              <td>{t.prioridad || '—'}</td>
            </tr>
          ))}
          {!proximasTareas.length && <tr><td colSpan={5} style={{textAlign:'center',opacity:.7}}>—</td></tr>}
        </tbody>
      </table>

      <h3 style={{marginTop:16}}>Próximas entregas (10 días)</h3>
      <table className="tbl">
        <thead><tr><th>Fin</th><th>Código</th><th>Proyecto</th><th>Cliente</th><th>Prioridad</th></tr></thead>
        <tbody>
          {proximasEntregas.map(e=>(
            <tr key={e.id}>
              <td>{e.fin || '—'}</td>
              <td><a href={`/expedientes/${encodeURIComponent(e.codigo || '')}`}>{e.codigo || '—'}</a></td>
              <td>{e.proyecto || '—'}</td>
              <td>{e.cliente || '—'}</td>
              <td>{e.prioridad || '—'}</td>
            </tr>
          ))}
          {!proximasEntregas.length && <tr><td colSpan={5} style={{textAlign:'center',opacity:.7}}>—</td></tr>}
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
