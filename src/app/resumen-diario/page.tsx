// src/app/resumen-diario/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import type { CSSProperties } from 'react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { normalizeOne, getTituloFromRelation } from '../../lib/relations';
import CopyBox from '../../components/CopyBox';

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

function tareaTitulo(rel: any): string | undefined {
  return getTituloFromRelation(rel);
}

function num(n: any): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}
function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}

export default async function ResumenDiarioPage() {
  const sb = supabaseAdmin();

  // Rango: hoy y últimos 10 días
  const { start, end } = rangeUltimosDias(10);
  const hoy = ymd(new Date());
  const fechaLimite = end;

  // Partes (para horas totales / visitas)
  const { data: partes, error: errPartes } = await sb
    .from('partes')
    .select(`
      id, fecha, horas, 
      tarea:tarea_id ( titulo )
    `)
    .gte('fecha', start)
    .lte('fecha', end);

  if (errPartes) {
    return (
      <main style={{ padding: 16 }}>
        <h2>Resumen diario</h2>
        <p>Error al cargar partes: {errPartes.message}</p>
      </main>
    );
  }

  // Tareas pendientes próximas (10 días)
  const { data: tareasPend, error: errTareas } = await sb
    .from('tareas')
    .select(`
      id, titulo, vencimiento, estado, prioridad,
      expedientes ( codigo, proyecto, cliente )
    `)
    .not('estado', 'ilike', 'completada%');

  if (errTareas) {
    return (
      <main style={{ padding: 16 }}>
        <h2>Resumen diario</h2>
        <p>Error al cargar tareas: {errTareas.message}</p>
      </main>
    );
  }

  // Expedientes con próximas entregas (10 días)
  const { data: expedientes, error: errExps } = await sb
    .from('expedientes')
    .select(`id, codigo, proyecto, cliente, prioridad, fin`);

  if (errExps) {
    return (
      <main style={{ padding: 16 }}>
        <h2>Resumen diario</h2>
        <p>Error al cargar expedientes: {errExps.message}</p>
      </main>
    );
  }

  // --- Métricas ---
  const esVisita = (s?: string | null) => {
    if (!s) return false;
    const t = s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    return t.includes('visita');
  };

  const horasTotales = sum((partes || []).map((p) => num((p as any).horas)));

  const horasVisitas = sum(
    (partes || [])
      .filter((p) => esVisita(tareaTitulo((p as any).tarea)))
      .map((p) => num((p as any).horas))
  );

  const proximasTareas = (tareasPend || [])
    .filter((t) => {
      const v = (t.vencimiento || '').slice(0, 10);
      return v && v >= hoy && v <= fechaLimite;
    })
    .sort((a, b) => (a.vencimiento || '').localeCompare(b.vencimiento || ''));

  const proximasEntregas = (expedientes || [])
    .filter((e) => {
      const f = (e.fin || '').slice(0, 10);
      return f && f >= hoy && f <= fechaLimite;
    })
    .sort((a, b) => (a.fin || '').localeCompare(b.fin || ''));

  // --- Texto resumen para copiar ---
  const fmt = (d?: string | null) => (d ? d.slice(0, 10).split('-').reverse().join('/') : '—');
  const lineasTareas = proximasTareas.slice(0, 8).map((t) => {
    const exp = normalizeOne((t as any).expedientes);
    const cod = exp?.codigo || '—';
    return `• ${fmt(t.vencimiento)} — [${cod}] ${t.titulo || ''} (${t.prioridad || '—'})`;
  });
  const lineasEntregas = proximasEntregas.slice(0, 8).map((e) => {
    return `• ${fmt(e.fin)} — [${e.codigo || '—'}] ${e.proyecto || ''} (${e.prioridad || '—'})`;
  });
  const textoCopia = [
    `RESUMEN DIARIO (${fmt(hoy)})`,
    `- Horas totales: ${horasTotales.toFixed(2)} h`,
    `- Horas visitas: ${horasVisitas.toFixed(2)} h`,
    `- Próximas tareas (≤10 días): ${proximasTareas.length}`,
    ...(lineasTareas.length ? ['  Detalle:', ...lineasTareas] : []),
    `- Próximas entregas (≤10 días): ${proximasEntregas.length}`,
    ...(lineasEntregas.length ? ['  Detalle:', ...lineasEntregas] : []),
  ].join('\n');

  // Estilos
  const mainStyle: CSSProperties = { padding: 16 };
  const cardStyle: CSSProperties = {
    background: 'var(--cic-bg-card, #fff)',
    border: '1px solid var(--cic-border, #e5e5e5)',
    borderRadius: 8,
    padding: 12,
    flex: 1,
  };
  const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 };
  const tblStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: 8 };
  const thStyle: CSSProperties = {
    textAlign: 'left', borderBottom: '1px solid var(--cic-border, #e5e5e5)', padding: '8px 6px', fontWeight: 600,
  };
  const tdStyle: CSSProperties = { borderBottom: '1px solid var(--cic-border, #f0f0f0)', padding: '8px 6px' };
  const linkStyle: CSSProperties = { color: 'var(--cic-primary, #0b5fff)', textDecoration: 'none' };

  return (
    <main style={mainStyle}>
      <h2>Resumen diario</h2>

      {/* Botón de copia */}
      <div style={{ margin: '8px 0 16px' }}>
        <CopyBox text={textoCopia} />
      </div>

      <section style={gridStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: '.9rem', opacity: 0.7 }}>Horas totales</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{horasTotales.toFixed(2)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '.9rem', opacity: 0.7 }}>Horas visitas</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{horasVisitas.toFixed(2)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '.9rem', opacity: 0.7 }}>Próximas tareas (10 días)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{(proximasTareas || []).length}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '.9rem', opacity: 0.7 }}>Próximas entregas (10 días)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{(proximasEntregas || []).length}</div>
        </div>
      </section>

      <h3 style={{ marginTop: 16 }}>Próximas tareas (10 días)</h3>
      <table style={tblStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Vencimiento</th>
            <th style={thStyle}>Expediente</th>
            <th style={thStyle}>Proyecto</th>
            <th style={thStyle}>Cliente</th>
            <th style={thStyle}>Prioridad</th>
          </tr>
        </thead>
        <tbody>
          {proximasTareas.map((t) => {
            const exp = normalizeOne((t as any).expedientes);
            return (
              <tr key={t.id}>
                <td style={tdStyle}>{t.vencimiento || '—'}</td>
                <td style={tdStyle}>
                  <a href={`/expedientes/${encodeURIComponent(exp?.codigo || '')}`} style={linkStyle}>
                    {exp?.codigo || '—'}
                  </a>
                </td>
                <td style={tdStyle}>{exp?.proyecto || '—'}</td>
                <td style={tdStyle}>{exp?.cliente || '—'}</td>
                <td style={tdStyle}>{t.prioridad || '—'}</td>
              </tr>
            );
          })}
          {!proximasTareas.length && (
            <tr>
              <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', opacity: 0.7 }}>—</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3 style={{ marginTop: 16 }}>Próximas entregas (10 días)</h3>
      <table style={tblStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Fin</th>
            <th style={thStyle}>Expediente</th>
            <th style={thStyle}>Proyecto</th>
            <th style={thStyle}>Cliente</th>
            <th style={thStyle}>Prioridad</th>
          </tr>
        </thead>
        <tbody>
          {proximasEntregas.map((e) => (
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
          {!proximasEntregas.length && (
            <tr>
              <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', opacity: 0.7 }}>—</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
