// src/app/resumen-mensual/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { normalizeOne, getTituloFromRelation } from '../../lib/relations';
import { rangeMesActual, isBetween } from '../../lib/dateUtils';
import ErrorState from '../../components/ErrorState';
import TableEmptyRow from '../../components/TableEmptyRow';
import CopyBox from '../../components/CopyBox';

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
const esVisita = (s?: string | null) => {
  if (!s) return false;
  const t = s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  return t.includes('visita');
};

export default async function ResumenMensualPage() {
  const sb = supabaseAdmin();
  const { start, end } = rangeMesActual();

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

  if (errP || errT || errExps) {
    return (
      <main style={{ padding: 16 }}>
        <h2>Resumen mensual</h2>
        {errP && <ErrorState mensaje={`Error al cargar partes: ${errP.message}`} />}
        {errT && <ErrorState mensaje={`Error al cargar tareas: ${errT.message}`} />}
        {errExps && <ErrorState mensaje={`Error al cargar expedientes: ${errExps.message}`} />}
      </main>
    );
  }

  // Horas por expediente del mes
  const horasPorExpediente: Record<string, { codigo: string; proyecto: string; cliente: string; horas: number }> = {};
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

  // Detección de visitas por título de tarea en PARTES
  const horasVisitasMes = sum(
    (partes || [])
      .filter((p: any) => esVisita(tareaTitulo(p.tarea)))
      .map((p: any) => num(p.horas))
  );

  // Tareas completadas en el mes (por fecha_cierre en el mes)
  const tareasCompletadasMes = (tareasAll || []).filter((t: any) =>
    isBetween(t.fecha_cierre, start, end)
  );

  // Tareas abiertas (estado != completada)
  const tareasAbiertas = (tareasAll || []).filter(
    (t: any) => (t.estado ?? '').toLowerCase() !== 'completada'
  );

  // Próximas entregas del mes
  const proximasEntregas = (exps || [])
    .filter((e: any) => isBetween(e.fin, start, end))
    .sort((a: any, b: any) => (a.fin || '').localeCompare(b.fin || ''));

  // --- Texto para la caja de copiado (Agenda) ---
  const fmt = (d?: string | null) => (d ? (d.includes('T') ? d.split('T')[0] : d).split('-').reverse().join('/') : '—');
  const top3 = Object.values(horasPorExpediente).sort((a, b) => b.horas - a.horas).slice(0, 3);
  const textoCopia = [
    `RESUMEN MENSUAL (${fmt(start)}–${fmt(end)})`,
    `- Horas totales: ${horasTotalesMes.toFixed(2)} h`,
    `- Horas visitas: ${horasVisitasMes.toFixed(2)} h`,
    `- Tareas completadas: ${tareasCompletadasMes.length}`,
    `- Tareas abiertas: ${tareasAbiertas.length}`,
    `- Top expedientes por horas:`,
    ...top3.map((r) => `  • [${r.codigo}] ${r.proyecto} — ${r.horas.toFixed(2)} h`),
  ].join('\n');

  // Estilos
  const mainStyle: React.CSSProperties = { padding: 16 };
  const cardStyle: React.CSSProperties = {
    background: 'var(--cic-bg-card, #fff)',
    border: '1px solid var(--cic-border, #e5e5e5)',
    borderRadius: 8,
    padding: 12,
    flex: 1,
  };
  const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 };
  const tblStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: 8 };
  const thStyle: React.CSSProperties = {
    textAlign: 'left', borderBottom: '1px solid var(--cic-border, #e5e5e5)', padding: '8px 6px', fontWeight: 600,
  };
  const tdStyle: React.CSSProperties = { borderBottom: '1px solid var(--cic-border, #f0f0f0)', padding: '8px 6px' };
  const linkStyle: React.CSSProperties = { color: 'var(--cic-primary, #0b5fff)', textDecoration: 'none' };

  return (
    <main style={mainStyle}>
      <h2>Resumen mensual</h2>

      {/* Caja de copiado */}
      <div style={{ margin: '8px 0 16px' }}>
        <CopyBox text={textoCopia} />
      </div>

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
          <div style={{ fontSize: '.9rem', opacity: 0.7 }}>Tareas completadas</div>
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
            .filter((e: any) => isBetween(e.fin, start, end))
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
          {!exps?.length && <TableEmptyRow colSpan={5} mensaje="Sin entregas en el mes" />}
        </tbody>
      </table>
    </main>
  );
}
