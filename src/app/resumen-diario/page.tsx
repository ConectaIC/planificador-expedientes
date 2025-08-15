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
  const { start, end } = rangeUltimosDias(4);

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

  const hoy = ymd(new Date());
  const fechaLimite = ymd(new Date(new Date().setDate(new Date().getDate() + 10)));

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

  const { data: exps, error: errExps } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto, cliente, fin, estado, prioridad')
    .neq('estado', 'Entregado')
    .neq('estado', 'Cerrado');

  if (errExps) {
    return <main><h2>Resumen diario</h2><p>Error al cargar expedientes: {errExps.message}</p></main>;
  }

  const num = (x: any) => (typeof x === 'number' ? x : Number(x || 0));
  const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);

  const horasTotales = sum((partes || []).map(p => num(p.horas)));

  const esVisita = (s?: string | null) => {
    if (!s) return false;
    const t = s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    return t.includes('visita');
  };
  const horasVisitas = sum((partes || [])
    .filter(p => esVisita(p.tarea?.titulo))
    .map(p => num(p.horas)));

  const proximasTareas = (tareasPend || [])
    .filter(t => {
      const v = (t.vencimiento || '').slice(0, 10);
      return v && v >= hoy && v <= fechaLimite;
    })
    .sort((a, b) => (a.vencimiento || '').localeCompare(b.vencimiento || ''));

  const proximasEntregas = (exps || [])
    .filter(e => {
      const f = (e.fin || '').slice(0, 10);
      return f && f >= hoy && f <= fechaLimite;
    })
    .sort((a, b) => (a.fin || '').localeCompare(b.fin || ''));

  const cardStyle: React.CSSProperties = { background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:12 };
  const gridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12, margin:'12px 0' };
  const tblStyle: React.CSSProperties = { width:'100%', borderCollapse:'separate', borderSpacing:'0 6px', marginTop:8 };
  const thStyle: React.CSSProperties = { fontWeight:600, textAlign:'left', padding:'6px 10px' };
  const tdStyle: React.CSSProperties = { background:'#fff', padding:'10px', borderTop:'1px solid #eef1f5', borderBottom:'1px solid #eef1f5' };
  const linkStyle: React.CSSProperties = { color:'var(--cic-primary)' };

  return (
    <main>
      <h2>Resumen diario</h2>
      <p>Últimos días: <b>{start}</b> a <b>{end}</b></p>

      <section style={gridStyle}>
        <div style={cardStyle}><div style={{fontSize:'.9rem',color:'#6b7280'}}>Horas totales</div><div style={{fontSize:'1.4rem',fontWeight:700}}>{horasTotales.toFixed(2)}</div></div>
        <div style={cardStyle}><div style={{fontSize:'.9rem',color:'#6b7280'}}>Visitas de obra (h)</div><div style={{fontSize:'1.4rem',fontWeight:700}}>{horasVisitas.toFixed(2)}</div></div>
        <div style={cardStyle}><div style={{fontSize:'.9rem',color:'#6b7280'}}>Próximas tareas</div><div style={{fontSize:'1.4rem',fontWeight:700}}>{(proximasTareas||[]).length}</div></div>
        <div style={cardStyle}><div style={{fontSize:'.9rem',color:'#6b7280'}}>Próximas entregas</div><div style={{fontSize:'1.4rem',fontWeight:700}}>{(proximasEntregas||[]).length}</div></div>
      </section>

      <h3 style={{marginTop:16}}>Próximas tareas (10 días)</h3>
      <table style={tblStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Vencimiento</th>
            <th style={thStyle}>Título</th>
            <th style={thStyle}>Expediente</th>
            <th style={thStyle}>Cliente</th>
            <th style={thStyle}>Prioridad</th>
          </tr>
        </thead>
        <tbody>
          {proximasTareas.map(t=>(
            <tr key={t.id}>
              <td style={tdStyle}>{t.vencimiento || '—'}</td>
              <td style={tdStyle}>{t.titulo}</td>
              <td style={tdStyle}>
                <a href={`/expedientes/${encodeURIComponent(t.expedientes?.codigo || '')}`} style={linkStyle}>
                  {t.expedientes?.codigo || '—'}
                </a>
              </td>
              <td style={tdStyle}>{t.expedientes?.cliente || '—'}</td>
              <td style={tdStyle}>{t.prioridad || '—'}</td>
            </tr>
          ))}
          {!proximasTareas.length && <tr><td colSpan={5} style={{...tdStyle, textAlign:'center', opacity:.7}}>—</td></tr>}
        </tbody>
      </table>

      <h3 style={{marginTop:16}}>Próximas entregas (10 días)</h3>
      <table style={tblStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Fin</th>
            <th style={thStyle}>Código</th>
            <th style={thStyle}>Proyecto</th>
            <th style={thStyle}>Cliente</th>
            <th style={thStyle}>Prioridad</th>
          </tr>
        </thead>
        <tbody>
          {proximasEntregas.map(e=>(
            <tr key={e.id}>
              <td style={tdStyle}>{e.fin || '—'}</td>
              <td style={tdStyle}>
                <a href={`/expedientes/${encodeURIComponent(e.codigo || '')}`} style={linkStyle}>
                  {e.codigo || '—'}
                </a>
              </td>
              <td style={tdStyle}>{e.proyecto || '—'}</td>
              <td style={tdStyle}>{e.cliente || '—'}</td>
              <td style={tdStyle}>{e.prioridad || '—'}</td>
            </tr>
          ))}
          {!proximasEntregas.length && <tr><td colSpan={5} style={{...tdStyle, textAlign:'center', opacity:.7}}>—</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
