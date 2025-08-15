// src/app/tareas/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { normalizeOne } from '../../lib/relations';
import FiltrosTareasGlobal from '../../components/FiltrosTareasGlobal';

type Props = {
  searchParams?: {
    q?: string;      // proyecto, expediente (código), cliente, título
    estado?: string;
    prioridad?: string;
    orden?: string;  // "vencimiento:asc|desc" | "horas:asc|desc"
  };
};

export default async function TareasPage({ searchParams }: Props) {
  const sb = supabaseAdmin();

  const q = (searchParams?.q || '').trim().toLowerCase();
  const estado = (searchParams?.estado || '').trim();
  const prioridad = (searchParams?.prioridad || '').trim();
  const orden = (searchParams?.orden || 'vencimiento:asc').trim();

  const { data, error } = await sb
    .from('tareas')
    .select(`
      id,
      expediente_id,
      titulo,
      horas_previstas,
      horas_realizadas,
      estado,
      prioridad,
      vencimiento,
      expedientes ( codigo, proyecto, cliente )
    `);

  if (error) {
    return (
      <main>
        <div className="card"><h2>Tareas</h2></div>
        <p className="error-state">Error al cargar tareas: {error.message}</p>
      </main>
    );
  }

  let tareas = (data || []).filter((t: any) => {
    const exp = normalizeOne(t.expedientes);
    const hitQ =
      !q ||
      [t.titulo, exp?.proyecto, exp?.cliente, exp?.codigo]
        .some((v) => String(v || '').toLowerCase().includes(q));
    const hitEstado = !estado || String(t.estado || '') === estado;
    const hitPrioridad = !prioridad || String(t.prioridad || '') === prioridad;
    return hitQ && hitEstado && hitPrioridad;
  });

  const [campo, dir] = (orden.includes(':') ? orden : 'vencimiento:asc').split(':') as [
    'vencimiento' | 'horas',
    'asc' | 'desc'
  ];
  tareas = tareas.sort((a: any, b: any) => {
    let va: any = '';
    let vb: any = '';
    switch (campo) {
      case 'vencimiento':
        va = a.vencimiento || '';
        vb = b.vencimiento || '';
        break;
      case 'horas': {
        const ha = Number(a.horas_realizadas ?? 0);
        const hb = Number(b.horas_realizadas ?? 0);
        va = Number.isFinite(ha) ? ha : 0;
        vb = Number.isFinite(hb) ? hb : 0;
        break;
      }
    }
    const cmp =
      typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb));
    return cmp * (dir === 'desc' ? -1 : 1);
  });

  const th: React.CSSProperties = { textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid var(--cic-border)', background: '#f1f6ff' };
  const td: React.CSSProperties = { padding: '10px 8px', borderBottom: '1px solid var(--cic-border)' };
  const link: React.CSSProperties = { color: 'var(--cic-primary)', textDecoration: 'none' };
  const fmt2 = (n: any) => (Number.isFinite(Number(n)) ? Number(n).toFixed(2) : '—');

  return (
    <main>
      <div className="card" style={{ marginBottom: 12 }}>
        <h2 style={{ marginBottom: 8 }}>Tareas</h2>
        <FiltrosTareasGlobal orderParamName="orden" />
      </div>

      <table>
        <thead>
          <tr>
            <th style={th}>Vencimiento</th>
            <th style={th}>Expediente</th>
            <th style={th}>Proyecto</th>
            <th style={th}>Cliente</th>
            <th style={th}>Título</th>
            <th style={th}>Estado</th>
            <th style={th}>Prioridad</th>
            <th style={th}>Horas prev.</th>
            <th style={th}>Horas real.</th>
            <th style={th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tareas.map((t: any) => {
            const exp = normalizeOne(t.expedientes);
            return (
              <tr key={t.id}>
                <td style={td}>{t.vencimiento || '—'}</td>
                <td style={td}>
                  {exp?.codigo ? (
                    <a href={`/expedientes/${encodeURIComponent(exp.codigo)}`} style={link}>
                      {exp.codigo}
                    </a>
                  ) : '—'}
                </td>
                <td style={td}>{exp?.proyecto || '—'}</td>
                <td style={td}>{exp?.cliente || '—'}</td>
                <td style={td}>
                  {/* Aquí no se crean tareas; solo ver/editar/borrar */}
                  <span>{t.titulo || '—'}</span>
                </td>
                <td style={td}>{t.estado || '—'}</td>
                <td style={td}>{t.prioridad || '—'}</td>
                <td style={td}>{fmt2(t.horas_previstas)}</td>
                <td style={td}>{fmt2(t.horas_realizadas)}</td>
                <td style={td}>
                  <a href={`/tareas/${t.id}?edit=1`} title="Editar" style={link}>✏️</a>{' '}
                  <a href={`/tareas/${t.id}?delete=1`} title="Borrar" style={link}>🗑️</a>
                </td>
              </tr>
            );
          })}
          {!tareas.length && (
            <tr>
              <td colSpan={10} style={{ ...td, textAlign: 'center', opacity: 0.7 }}>
                No hay tareas con esos criterios.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
