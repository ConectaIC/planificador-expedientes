export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../../lib/supabaseAdmin';

type Params = { params: { codigo: string } };

export default async function ExpedienteDetallePage({ params }: Params) {
  const { codigo } = params;
  const sb = supabaseAdmin();

  const { data: exp, error: errExp } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto, cliente, inicio, fin, prioridad, estado, horas_previstas, horas_reales')
    .eq('codigo', codigo)
    .single();

  if (errExp) {
    return (
      <main>
        <div className="card" style={{ marginBottom: 12 }}><h2>Expediente</h2></div>
        <p className="error-state">No se pudo cargar el expediente “{codigo}”: {errExp.message}</p>
        <p style={{ marginTop: 8 }}><a href="/expedientes" className="btn-link">← Volver al listado</a></p>
      </main>
    );
  }

  const { data: tareas, error: errT } = await sb
    .from('tareas')
    .select('id, titulo, estado, prioridad, horas_previstas, horas_realizadas, vencimiento')
    .eq('expediente_id', exp.id)
    .order('vencimiento', { ascending: true });

  const box: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 };
  const th: React.CSSProperties = { textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid var(--cic-border)', background: '#f1f6ff' };
  const td: React.CSSProperties = { padding: '10px 8px', borderBottom: '1px solid var(--cic-border)' };
  const link: React.CSSProperties = { color: 'var(--cic-primary)', textDecoration: 'none' };
  const fmt2 = (n: any) => (Number.isFinite(Number(n)) ? Number(n).toFixed(2) : '—');

  return (
    <main>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Expediente · {exp.codigo}</h2>
        <a href={`/tareas/nueva?expediente=${encodeURIComponent(exp.id)}`} className="btn-link">+ Nueva tarea</a>
      </div>

      <section className="card" style={{ marginBottom: 12 }}>
        <div style={box}>
          <div><div style={{ opacity: .7, fontSize: '.9rem' }}>Proyecto</div><div style={{ fontWeight: 700 }}>{exp.proyecto || '—'}</div></div>
          <div><div style={{ opacity: .7, fontSize: '.9rem' }}>Cliente</div><div style={{ fontWeight: 700 }}>{exp.cliente || '—'}</div></div>
          <div><div style={{ opacity: .7, fontSize: '.9rem' }}>Estado</div><div style={{ fontWeight: 700 }}>{exp.estado || '—'}</div></div>
          <div><div style={{ opacity: .7, fontSize: '.9rem' }}>Prioridad</div><div style={{ fontWeight: 700 }}>{exp.prioridad || '—'}</div></div>
          <div><div style={{ opacity: .7, fontSize: '.9rem' }}>Inicio</div><div style={{ fontWeight: 700 }}>{exp.inicio || '—'}</div></div>
          <div><div style={{ opacity: .7, fontSize: '.9rem' }}>Fin</div><div style={{ fontWeight: 700 }}>{exp.fin || '—'}</div></div>
          <div><div style={{ opacity: .7, fontSize: '.9rem' }}>Horas previstas</div><div style={{ fontWeight: 700 }}>{fmt2(exp.horas_previstas)}</div></div>
          <div><div style={{ opacity: .7, fontSize: '.9rem' }}>Horas reales</div><div style
