// src/app/partes/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function PartesPage() {
  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from('partes')
    .select(`
      id,
      fecha,
      horas,
      comentario,
      tarea_id,
      expedientes ( codigo, proyecto, cliente ),
      tarea:tarea_id ( titulo )
    `)
    .order('fecha', { ascending: false });

  if (error) {
    return (
      <main>
        <div className="card">
          <h2>Partes</h2>
        </div>
        <p className="error-state" style={{ marginTop: 12 }}>Error al cargar partes: {error.message}</p>
      </main>
    );
  }

  const th: React.CSSProperties = { textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid var(--cic-border)', background: '#f1f6ff' };
  const td: React.CSSProperties = { padding: '10px 8px', borderBottom: '1px solid var(--cic-border)' };
  const link: React.CSSProperties = { color: 'var(--cic-primary)', textDecoration: 'none' };
  const fmt2 = (n: any) => (Number.isFinite(Number(n)) ? Number(n).toFixed(2) : '—');

  return (
    <main>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Partes</h2>
        {/* Próxima iteración: esto abrirá un modal cliente de creación */}
        <a href="/partes/nuevo" style={link}>+ Nuevo parte</a>
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
          </tr>
        </thead>
        <tbody>
          {(data || []).map((p: any) => {
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
              </tr>
            );
          })}
          {!data?.length && (
            <tr>
              <td colSpan={6} style={{ ...td, textAlign: 'center', opacity: .7 }}>No hay partes registrados.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
