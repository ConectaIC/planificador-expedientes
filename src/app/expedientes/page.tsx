export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import FiltrosExepdientes from '../../components/FiltrosExepdientes';

type Props = {
  searchParams?: {
    q?: string;
    estado?: string;
    prioridad?: string;
    orden?: string; // "fin:asc|fin:desc|codigo:asc|codigo:desc|horas:asc|horas:desc"
  };
};

export default async function ExpedientesPage({ searchParams }: Props) {
  const sb = supabaseAdmin();

  const q = (searchParams?.q || '').trim().toLowerCase();
  const estado = (searchParams?.estado || '').trim();
  const prioridad = (searchParams?.prioridad || '').trim();
  const orden = (searchParams?.orden || 'fin:asc').trim();

  const { data, error } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto, cliente, inicio, fin, prioridad, estado, horas_previstas, horas_reales');

  if (error) {
    return (
      <main>
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2>Expedientes</h2>
          <a href="/expedientes/nuevo" className="btn-link">+ Nuevo expediente</a>
        </div>
        <p className="error-state">Error al cargar expedientes: {error.message}</p>
      </main>
    );
  }

  // Filtro + búsqueda
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

  // Orden (campo:dir)
  const [campo, dir] = (orden.includes(':') ? orden : 'fin:asc').split(':') as [
    'codigo' | 'inicio' | 'fin' | 'horas',
    'asc' | 'desc'
  ];
  expedientes = expedientes.sort((a: any, b: any) => {
    let va: any = '';
    let vb: any = '';
    switch (campo) {
      case 'codigo': va = a.codigo || ''; vb = b.codigo || ''; break;
      case 'inicio': va = a.inicio || ''; vb = b.inicio || ''; break;
      case 'fin':    va = a.fin || '';    vb = b.fin || '';    break;
      case 'horas': {
        const ha = Number(a.horas_reales ?? a.horas_previstas ?? 0);
        const hb = Number(b.horas_reales ?? b.horas_previstas ?? 0);
        va = Number.isFinite(ha) ? ha : 0;
        vb = Number.isFinite(hb) ? hb : 0;
        break;
      }
    }
    const cmp = typeof va === 'number' && typeof vb === 'number'
      ? (va - vb)
      : String(va).localeCompare(String(vb), 'es', { numeric: true });
    return cmp * (dir === 'desc' ? -1 : 1);
  });

  const th: React.CSSProperties = { textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid var(--cic-border)', background: '#f1f6ff' };
  const td: React.CSSProperties = { padding: '10px 8px', borderBottom: '1px solid var(--cic-border)' };
  const link: React.CSSProperties = { color: 'var(--cic-primary)', textDecoration: 'none' };
  const fmt2 = (n: any) => (Number.isFinite(Number(n)) ? Number(n).toFixed(2) : '—');

  return (
    <main>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h2 style={{ marginBottom: 8 }}>Expedientes</h2>
          <FiltrosExepdientes orderParamName="orden" />
        </div>
        <a href="/expedientes/nuevo" className="btn-link">+ Nuevo expediente</a>
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
            <th style={th}>Horas</th>
            <th style={th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {expedientes.map((e) => (
            <tr key={e.id}>
              <td style={td}>
                {e.codigo ? (
                  <a href={`/expedientes/${encodeURIComponent(e.codigo)}`} style={link}>{e.codigo}</a>
                ) : '—'}
              </td>
              <td style={td}>{e.proyecto || '—'}</td>
              <td style={td}>{e.cliente || '—'}</td>
              <td style={td}>{e.estado || '—'}</td>
              <td style={td}>{e.prioridad || '—'}</td>
              <td style={td}>{e.inicio || '—'}</td>
              <td style={td}>{e.fin || '—'}</td>
              <td style={td}>{fmt2(e.horas_reales ?? e.horas_previstas)}</td>
              <td style={td}>
                {/* Próxima iteración: modales */}
                <a href={`/expedientes/${encodeURIComponent(e.codigo)}?edit=1`} title="Editar" style={link}>✏️</a>{' '}
                <a href={`/expedientes/${encodeURIComponent(e.codigo)}?delete=1`} title="Borrar" style={link}>🗑️</a>
              </td>
            </tr>
          ))}
          {!expedientes.length && (
            <tr>
              <td colSpan={9} style={{ ...td, textAlign: 'center', opacity: .7 }}>No hay expedientes con esos criterios.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
