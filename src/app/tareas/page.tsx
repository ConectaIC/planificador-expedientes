// src/app/tareas/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { normalizeOne } from '../../lib/relations';

type Props = {
  searchParams?: {
    q?: string;                 // proyecto, expediente (código), cliente, título
    estado?: string;
    prioridad?: string;
    ordenar?: 'vencimiento';
    dir?: 'asc' | 'desc';
  };
};

export default async function TareasPage({ searchParams }: Props) {
  const sb = supabaseAdmin();

  const q = (searchParams?.q || '').trim().toLowerCase();
  const estado = (searchParams?.estado || '').trim();
  const prioridad = (searchParams?.prioridad || '').trim();
  const ordenar = (searchParams?.ordenar as any) || 'vencimiento';
  const dir = (searchParams?.dir as any) || 'asc';

  // Cargamos tareas + expediente para filtros cruzados
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
        <div className="card">
          <h2>Tareas</h2>
        </div>
        <p className="error-state" style={{ marginTop: 12 }}>Error al cargar tareas: {error.message}</p>
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

  tareas = tareas.sort((a: any, b: any) => {
    const va = a.vencimiento || '';
    const vb = b.vencimiento || '';
    return String(va).localeCompare(String(vb)) * (dir === 'desc' ? -1 : 1);
  });

  const th: React.CSSProperties = { textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid var(--cic-border)', background: '#f1f6ff' };
  const td: React.CSSProperties = { padding: '10px 8px', borderBottom: '1px solid var(--cic-border)' };
  const link: React.CSSProperties = { color: 'var(--cic-primary)', textDecoration: 'none' };
  const controls: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 };
  const fmt2 = (n: any) => (Number.isFinite(Number(n)) ? Number(n).toFixed(2) : '—');

  return (
    <main>
      <div className="card" style={{ marginBottom: 12 }}>
        <h2 style={{ marginBottom: 10 }}>Tareas</h2>
        <form method="get" style={controls}>
          <input name="q" placeholder="Buscar por proyecto, expediente, cliente o título" defaultValue={q} />
          <select name="estado" defaultValue={estado}>
            <option value="">Estado (todos)</option>
            <option>Pendiente</option>
            <option>En curso</option>
            <option>Completada</option>
          </select>
          <select name="prioridad" defaultValue={prioridad}>
            <option value="">Prioridad (todas)</option>
            <option>Baja</option>
            <option>Media</option>
            <option>Alta</option>
          </select>
          <select name="ordenar" defaultValue={ordenar}>
            <option value="vencimiento">Ordenar por vencimiento</option>
          </select>
          <select name="dir" defaultValue={dir}>
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
          <button type="submit">Aplicar</button>
        </form>
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
                  ) : (
                    '—'
                  )}
                </td>
                <td style={td}>{exp?.proyecto || '—'}</td>
                <td style={td}>{exp?.cliente || '—'}</td>
                <td style={td}>
                  <a href={`/tareas/${encodeURIComponent(String(t.id))}`} style={link}>
                    {t.titulo || '—'}
                  </a>
                </td>
                <td style={td}>{t.estado || '—'}</td>
                <td style={td}>{t.prioridad || '—'}</td>
                <td style={td}>{fmt2(t.horas_previstas)}</td>
                <td style={td}>{fmt2(t.horas_realizadas)}</td>
              </tr>
            );
          })}
          {!tareas.length && (
            <tr>
              <td colSpan={9} style={{ ...td, textAlign: 'center', opacity: 0.7 }}>
                No hay tareas con esos criterios.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
