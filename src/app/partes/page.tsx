// src/app/partes/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';

type Props = {
  searchParams?: {
    orden?: string; // "fecha:asc|desc" | "horas:asc|desc"
  };
};

export default async function PartesPage({ searchParams }: Props) {
  const sb = supabaseAdmin();
  const orden = (searchParams?.orden || 'fecha:desc').trim();

  const { data, error } = await sb
    .from('partes')
    .select(`
      id,
      fecha,
      horas,
      comentario,
      tarea_id,
      expedientes ( codigo, proyecto, cliente, estado ),
      tarea:tarea_id ( titulo )
    `);

  if (error) {
    return (
      <main>
        <div className="card">
          <h2>Partes</h2>
        </div>
        <p className="error-state">Error al cargar partes: {error.message}</p>
      </main>
    );
  }

  // Solo expedientes activos (no 'Entregado' ni 'Cerrado')
  const activos = (data || []).filter((p: any) => {
    const est = String(p.expedientes?.estado || '');
    return est !== 'Entregado' && est !== 'Cerrado';
  });

  // Orden único
  const [campo, dir] = (orden.includes(':') ? orden : 'fecha:desc').split(':') as [
    'fecha' | 'horas',
    'asc' | 'desc'
  ];
  const partes = activos.sort((a: any, b: any) => {
    let va: any = '';
    let vb: any = '';
    switch (campo) {
      case 'fecha':
        va = a.fecha || '';
        vb = b.fecha || '';
        break;
      case 'horas': {
        const ha = Number(a.horas ?? 0);
        const hb = Number(b.horas ?? 0);
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
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <h2>Partes</h2>
          {/* Orden único automático sin botón (simple GET) */}
          <form method="get">
            <select name="orden" defaultValue={orden} onChange={(e) => (e.currentTarget.form as HTMLFormElement).submit()}>
              <option value="fecha:asc">Orden: Fecha ↑</option>
              <option value="fecha:desc">Orden: Fecha ↓</option>
              <option value="horas:asc">Orden: Horas ↑</option>
              <option value="horas:desc">Orden: Horas ↓</option>
            </select>
          </form>
        </div>
        {/* Próxima iteración: modal de alta */}
        <a href="/partes/nuevo" className="btn-link">+ Nuevo parte</a>
      </div>

      <table>
        <thead>
          <tr>
            <th style={th}>Fecha</th>
            <th style={th}>Expediente</th>
            <th style={th}>Proyecto</th>
            <th style={th}>Tarea</th>
            <th style={th}>Horas</th>
            <th style={th}>Comentario</th>
            <th style={th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {partes.map((p: any) => {
            const exp = p.expedientes;
            const tareaTitulo = p.tarea?.titulo || '—';
            return (
              <tr key={p.id}>
                <td style={td}>{p.fecha || '—'}</td>
                <td style={td}>
                  {exp?.codigo ? (
                    <a href={`/expedientes/${encodeURIComponent(exp.codigo)}`} style={link}>
                      {exp.codigo}
                    </a>
                  ) : '—'}
                </td>
                <td style={td}>{exp?.proyecto || '—'}</td>
                <td style={td}>{tareaTitulo}</td>
                <td style={td}>{fmt2(p.horas)}</td>
                <td style={td}>{p.comentario || '—'}</td>
                <td style={td}>
                  {/* Próxima iteración: modales */}
                  <a href={`/partes/${p.id}?edit=1`} title="Editar" style={link}>✏️</a>{' '}
                  <a href={`/partes/${p.id}?delete=1`} title="Borrar" style={link}>🗑️</a>
                </td>
              </tr>
            );
          })}
          {!partes.length && (
            <tr>
              <td colSpan={7} style={{ ...td, textAlign: 'center', opacity: .7 }}>No hay partes de expedientes activos.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
