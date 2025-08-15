// src/app/expedientes/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function ExpedientesPage() {
  const sb = supabaseAdmin();

  // Campos confirmados por ti: id, codigo, proyecto, cliente, inicio, fin, prioridad, estado
  // (De momento no mostramos horas_previstas / horas_reales para evitar dudas de nombre exacto.
  //  Si el nombre en DB es horas_reales y horas_previstas, los añadimos en la siguiente iteración.)
  const { data: expedientes, error } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto, cliente, inicio, fin, prioridad, estado')
    .order('codigo', { ascending: true });

  if (error) {
    return (
      <main>
        <div className="card">
          <h2>Expedientes</h2>
        </div>
        <p className="error-state" style={{ marginTop: 12 }}>
          Error al cargar expedientes: {error.message}
        </p>
      </main>
    );
  }

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

  return (
    <main>
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2>Expedientes</h2>
        {/* En esta versión mantenemos solo el listado. Añadiremos modales de alta/edición después. */}
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
          {(expedientes || []).map((e) => (
            <tr key={e.id}>
              <td style={td}>{e.codigo || '—'}</td>
              <td style={td}>{e.proyecto || '—'}</td>
              <td style={td}>{e.cliente || '—'}</td>
              <td style={td}>{e.estado || '—'}</td>
              <td style={td}>{e.prioridad || '—'}</td>
              <td style={td}>{e.inicio || '—'}</td>
              <td style={td}>{e.fin || '—'}</td>
            </tr>
          ))}
          {!expedientes?.length && (
            <tr>
              <td colSpan={7} style={{ ...td, textAlign: 'center', opacity: 0.7 }}>
                No hay expedientes registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
