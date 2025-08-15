// src/app/expedientes/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';

type Props = {
  searchParams?: {
    q?: string;
    estado?: string;
    prioridad?: string;
    ordenar?: 'codigo' | 'inicio' | 'fin';
    dir?: 'asc' | 'desc';
  };
};

export default async function ExpedientesPage({ searchParams }: Props) {
  const sb = supabaseAdmin();

  const q = (searchParams?.q || '').trim().toLowerCase();
  const estado = (searchParams?.estado || '').trim();
  const prioridad = (searchParams?.prioridad || '').trim();
  const ordenar = (searchParams?.ordenar as any) || 'codigo';
  const dir = (searchParams?.dir as any) || 'asc';

  // Campos confirmados: id, codigo, proyecto, cliente, inicio, fin, prioridad, estado
  const { data, error } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto, cliente, inicio, fin, prioridad, estado');

  if (error) {
    return (
      <main>
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2>Expedientes</h2>
        </div>
        <p className="error-state" style={{ marginTop: 12 }}>Error al cargar expedientes: {error.message}</p>
      </main>
    );
  }

  // Filtros y búsqueda (server-side JS sobre el resultado para evitar complejidad de OR sobre relaciones)
  let expedientes = (data || []).filter((e) => {
    const hitQ =
      !q ||
      [e.codigo, e.proyecto, e.cliente].some((v) =>
        String(v || '').toLowerCase().includes(q)
      );
    const hitEstado = !estado || String(e.estado || '') === estado;
    const hitPrioridad = !prioridad || String(e.prioridad || '') === prioridad;
    return hitQ && hitEstado && hitPrioridad;
  });

  // Ordenación
  expedientes = expedientes.sort((a: any, b: any) => {
    const va = (a as any)[ordenar] || '';
    const vb = (b as any)[ordenar] || '';
    return String(va).localeCompare(String(vb), 'es', { numeric: true }) * (dir === 'desc' ? -1 : 1);
  });

  const th: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px 8px',
    borderBottom: '1px solid var(--cic-border)',
    background: '#f1f6ff',
  };
  const td: React.CSSProperties = {
    padding: '10px 8px',
    borderBottom: '1px solid var(--cic-border)',
  };
  const link: React.CSSProperties = { color: 'var(--cic-primary)', textDecoration: 'none' };
  const controls: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' };

  return (
    <main>
      <div className="card" style={{ marginBottom: 12 }}>
        <h2 style={{ marginBottom: 10 }}>Expedientes</h2>
        {/* Controles: GET para mantener SSR y URLs compartibles */}
        <form method="get" style={controls}>
          <input name="q" placeholder="Buscar por código, proyecto o cliente" defaultValue={q} />
          <select name="estado" defaultValue={estado}>
            <option value="">Estado (todos)</option>
            <option>Pendiente</option>
            <option>En curso</option>
            <option>En supervisión</option>
            <option>Entregado</option>
            <option>Cerrado</option>
          </select>
          <select name="prioridad" defaultValue={prioridad}>
            <option value="">Prioridad (todas)</option>
            <option>Baja</option>
            <option>Media</option>
            <option>Alta</option>
          </select>
          <select name="ordenar" defaultValue={ordenar}>
            <option value="codigo">Ordenar por código</option>
            <option value="inicio">Ordenar por inicio</option>
            <option value="fin">Ordenar por fin</option>
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
            <th style={th}>Código</th>
            <th style={th}>Proyecto</th>
            <th style={th}>Cliente</th>
            <th style={th}>Estado</th>
            <th style={th}>Prioridad</th>
            <th style={th}>Inicio</th>
            <th style={th}>Fin</th>
          </tr>
        </thead>
        <tbody>
          {expedientes.map((e) => (
            <tr key={e.id}>
              <td style={td}>
                {e.codigo ? (
                  <a href={`/expedientes/${encodeURIComponent(e.codigo)}`} style={link}>
                    {e.codigo}
                  </a>
                ) : (
                  '—'
                )}
              </td>
              <td style={td}>{e.proyecto || '—'}</td>
              <td style={td}>{e.cliente || '—'}</td>
              <td style={td}>{e.estado || '—'}</td>
              <td style={td}>{e.prioridad || '—'}</td>
              <td style={td}>{e.inicio || '—'}</td>
              <td style={td}>{e.fin || '—'}</td>
            </tr>
          ))}
          {!expedientes.length && (
            <tr>
              <td colSpan={7} style={{ ...td, textAlign: 'center', opacity: 0.7 }}>
                No hay expedientes con esos criterios.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
