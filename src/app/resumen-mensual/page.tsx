// src/app/resumen-mensual/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import type { CSSProperties } from 'react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { normalizeOne, getTituloFromRelation } from '../../lib/relations';

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
function rangeMesActual() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: ymd(start), end: ymd(end) };
}
function num(n: any): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}
function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}
function tareaTitulo(rel: any): string | undefined {
  return getTituloFromRelation(rel);
}
const esVisita = (s?: string | null) => {
  if (!s) return false;
  const t = s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  return t.includes('visita');
};

export default async function ResumenMensualPage() {
  const sb = supabaseAdmin();
  const { start, end } = rangeMesActual();

  // Partes del mes (sin categoria_indirecta)
  const { data: partes, error: errP } = await sb
    .from('partes')
    .select(`
      id, fecha, horas,
      tarea:tarea_id ( titulo ),
      expedientes ( id, codigo, proyecto, cliente )
    `)
    .gte('fecha', start)
    .lte('fecha', end);

  const { data: tareasAll, error: errT } = await sb
    .from('tareas')
    .select(`
      id, titulo, estado, prioridad, vencimiento, fecha_cierre,
      expedientes ( codigo, proyecto, cliente )
    `);

  const { data: exps, error: errExps } = await sb
    .from('expedientes')
    .select(`id, codigo, proyecto, cliente, prioridad, fin`);

  // Errores
  if (errP || errT || errExps) {
    return (
      <main style={{ padding: 16 }}>
        <h2>Resumen mensual</h2>
        {errP && <p>Error al cargar partes: {errP.message}</p>}
        {errT && <p>Error al cargar tareas: {errT.message}</p>}
        {errExps && <p>Error al cargar expedientes: {errExps.message}</p>}
      </main>
    );
  }

  // Horas por expediente del mes
  const horasPorExpediente: Record<
    string,
    { codigo: string; proyecto: string; cliente: string; horas: number }
  > = {};

  (partes || []).forEach((p: any) => {
    const exp = normalizeOne(p.expedientes);
    if (!exp?.codigo) return;
    const key = exp.codigo;
    if (!horasPorExpediente[key]) {
      horasPorExpediente[key] = {
        codigo: exp.codigo,
        proyecto: exp.proyecto || '—',
        cliente: exp.cliente || '—',
        horas: 0,
      };
    }
    horasPorExpediente[key].horas += num(p.horas);
  });

  const horasTotalesMes = sum(Object.values(horasPorExpediente).map((r) => r.horas));
  const horasVisitasMes = sum(
    (partes || [])
      .filter((p: any) => esVisita(tareaTitulo(p.tarea)))
      .map((p: any) => num(p.horas))
  );

  const tareasCompletadasMes = (tareasAll || []).filter((t: any) => {
    const f = (t.fecha_cierre || '').slice(0, 10);
    return f && f >= start && f <= end;
  });

  const tareasAbiertas = (tareasAll || []).filter(
    (t: any) => (t.estado ?? '').toLowerCase() !== 'completada'
  );

  const proximasEntregas = (exps || [])
    .filter((e: any) => {
      const f = (e.fin || '').slice(0, 10);
      return f && f >= start && f <= end;
    })
    .sort((a: any, b: any) => (a.fin || '').localeCompare(b.fin || ''));

  // Estilos
  const mainStyle: CSSProperties = { padding: 16 };
  const cardStyle: CSSProperties = {
    background: 'var(--cic-bg-card, #fff)',
    border: '1px solid var(--cic-border, #e5e5e5)',
    borderRadius: 8,
    padding: 12,
    flex: 1,
  };
  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 12,
  };
  const tblStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: 8 };
  const thStyle: CSSProperties = {
    textAlign: 'left',
    borderBottom: '1px solid var(--cic-border, #e5e5e5)',
    padding: '8px 6px',
    fontWeight: 600,
  };
  const tdStyle: CSSProperties = {
    borderBottom: '1px solid var(--cic-border, #f0f0f0)',
    padding: '8px 6px',
  };
  const linkStyle: CSSProperties = { color: 'var(--cic-primary, #0b5fff)', textDecoration: 'none' };

  return (
    <main style={mainStyle}>
      <h2>Resumen mensual</h2>

      <section style={gridStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: '.9rem', opacity: 0.7 }}>Horas totales</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{horasTotalesMes.toFixed(2)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '.9rem', opacity: 0.7 }}>Horas visitas</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{horasVisitasMes.toFixed(2)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '.9rem', opacity: 0.7 }}>Tareas completadas (mes)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{tareasCompletadasMes.length}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '.9rem', opacity: 0.7 }}>Tareas abiertas</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{tareasAbiertas.length}</div>
        </div>
      </section>

      <h3 style={{ marginTop: 16 }}>Top expedientes por horas del mes</h3>
      <table style={tblStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Expediente</th>
            <th style={thStyle}>Proyecto</th>
            <th style={thStyle}>Cliente</th>
            <th style={thStyle}>Horas</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(horasPorExpediente)
            .sort((a, b) => b.horas - a.horas)
            .map((r) => (
              <tr key={r.codigo}>
                <td style={tdStyle}>
                  <a href={`/expedientes/${encodeURIComponent(r.codigo)}`} style={linkStyle}>
                    {r.codigo}
                  </a>
                </td>
                <td style={tdStyle}>{r.proyecto}</td>
                <td style={tdStyle}>{r.cliente}</td>
                <td style={tdStyle}>{r.horas.toFixed(2)}</td>
              </tr>
            ))}
          {!Object.values(horasPorExpediente).length && (
            <tr>
              <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', opacity: 0.7 }}>—</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3 style={{ marginTop: 16 }}>Tareas abiertas por prioridad</h3>
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
          {(tareasAbiertas || [])
            .sort((a: any, b: any) => (a.vencimiento || '').localeCompare(b.vencimiento || ''))
            .map((t: any) => {
              const exp = normalizeOne(t.expedientes);
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
          {!tareasAbiertas.length && (
            <tr>
              <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', opacity: 0.7 }}>—</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3 style={{ marginTop: 16 }}>Próximas entregas del mes</h3>
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
          {(exps || [])
            .filter((e: any) => {
              const f = (e.fin || '').slice(0, 10);
              return f && f >= start && f <= end;
            })
            .sort((a: any, b: any) => (a.fin || '').localeCompare(b.fin || ''))
            .map((e: any) => (
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
          {!exps?.length && (
            <tr>
              <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', opacity: 0.7 }}>—</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
