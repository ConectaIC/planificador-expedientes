// src/app/tareas/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { normalizeOne } from '../../lib/relations';

export default async function TareasPage() {
  const sb = supabaseAdmin();

  // Tareas con su expediente asociado (la relación puede venir como array/objeto)
  const { data: tareas, error: errT } = await sb
    .from('tareas')
    .select(`
      id, titulo, descripcion, estado, tipo, prioridad, horas_previstas, vencimiento, fecha_cierre,
      expedientes ( codigo, proyecto, cliente )
    `)
    .order('vencimiento', { ascending: true });

  if (errT) {
    return (
      <main style={{ padding: 16 }}>
        <h2>Tareas</h2>
        <p>Error al cargar tareas: {errT.message}</p>
      </main>
    );
  }

  const main: React.CSSProperties = { padding: 16 };
  const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
  const th: React.CSSProperties = {
    textAlign: 'left',
    borderBottom: '1px solid var(--cic-border, #e5e5e5)',
    padding: '8px 6px',
    fontWeight: 600,
  };
  const td: React.CSSProperties = {
    borderBottom: '1px solid var(--cic-border, #f0f0f0)',
    padding: '8px 6px',
    verticalAlign: 'top',
  };
  const link: React.CSSProperties = { color: 'var(--cic-primary, #0b5fff)', textDecoration: 'none' };

  return (
    <main style={main}>
      <h2>Tareas</h2>

      <table style={tbl}>
        <thead>
          <tr>
            <th style={th}>Vencimiento</th>
            <th style={th}>Expediente</th>
            <th style={th}>Proyecto</th>
            <th style={th}>Cliente</th>
            <th style={th}>Título</th>
            <th style={th}>Estado</th>
            <th style={th}>Tipo</th>
            <th style={th}>Prioridad</th>
            <th style={th}>Horas previstas</th>
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
                <td style={td}>{t.tipo || '—'}</td>
                <td style={td}>{t.prioridad || '—'}</td>
                <td style={td}>
                  {typeof t.horas_previstas === 'number' ? t.horas_previstas.toFixed(2) : '—'}
                </td>
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
