// src/app/tareas/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { normalizeOne } from '../../lib/relations';

export default async function TareasPage() {
  const sb = supabaseAdmin();

  // Campos confirmados por ti:
  // id, expediente_id, titulo, horas_previstas, horas_realizadas, estado, prioridad, vencimiento
  // Relación para mostrar datos del expediente (codigo, proyecto, cliente)
  const { data: tareas, error } = await sb
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
    `)
    .order('vencimiento', { ascending: true });

  if (error) {
    return (
      <main>
        <div className="card">
          <h2>Tareas</h2>
        </div>
        <p className="error-state" style={{ marginTop: 12 }}>
          Error al cargar tareas: {error.message}
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
  const link: React.CSSProperties = { color: 'var(--cic-primary)', textDecoration: 'none' };

  const fmt2 = (n: any) => {
    const v = Number(n);
    return Number.isFinite(v) ? v.toFixed(2) : '—';
  };

  return (
    <main>
      <div className="card" style={{ marginBottom: 12 }}>
        <h2>Tareas</h2>
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
          {(tareas || []).map((t: any) => {
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
                <td style={td}>{t.titulo || '—'}</td>
                <td style={td}>{t.estado || '—'}</td>
                <td style={td}>{t.prioridad || '—'}</td>
                <td style={td}>{fmt2(t.horas_previstas)}</td>
                <td style={td}>{fmt2(t.horas_realizadas)}</td>
              </tr>
            );
          })}
          {!tareas?.length && (
            <tr>
              <td colSpan={9} style={{ ...td, textAlign: 'center', opacity: 0.7 }}>
                No hay tareas registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
