// src/app/partes/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import NewParteModal from '../../components/NewParteModal';

export default async function PartesPage() {
  const sb = supabaseAdmin();

  // Datos para selects
  const { data: expedientes } = await sb.from('expedientes').select('id, codigo, proyecto').order('codigo', { ascending: true });
  const { data: tareas } = await sb.from('tareas').select('id, titulo, expediente_id').order('titulo', { ascending: true });

  // Listado simple de partes (últimos 30)
  const { data: partes } = await sb
    .from('partes')
    .select(`
      id, fecha, horas, inicio, fin, comentario,
      expedientes ( codigo ),
      tarea:tarea_id ( titulo )
    `)
    .order('fecha', { ascending: false })
    .limit(30);

  const mainStyle: React.CSSProperties = { padding: 16 };
  const header: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 };
  const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
  const th: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid #e5e5e5', padding: '8px 6px', fontWeight: 600 };
  const td: React.CSSProperties = { borderBottom: '1px solid #f0f0f0', padding: '8px 6px' };

  return (
    <main style={mainStyle}>
      <div style={header}>
        <h2>Partes</h2>
        <NewParteModal expedientes={expedientes || []} tareas={tareas || []} />
      </div>

      <table style={tbl}>
        <thead>
          <tr>
            <th style={th}>Fecha</th>
            <th style={th}>Expediente</th>
            <th style={th}>Tarea</th>
            <th style={th}>Inicio</th>
            <th style={th}>Fin</th>
            <th style={th}>Horas</th>
            <th style={th}>Comentario</th>
          </tr>
        </thead>
        <tbody>
          {(partes || []).map((p: any) => (
            <tr key={p.id}>
              <td style={td}>{p.fecha || '—'}</td>
              <td style={td}>{p.expedientes?.codigo || '—'}</td>
              <td style={td}>{p.tarea?.titulo || '—'}</td>
              <td style={td}>{p.inicio || '—'}</td>
              <td style={td}>{p.fin || '—'}</td>
              <td style={td}>{typeof p.horas === 'number' ? p.horas.toFixed(2) : '—'}</td>
              <td style={td}>{p.comentario || '—'}</td>
            </tr>
          ))}
          {!partes?.length && (
            <tr>
              <td colSpan={7} style={{ ...td, textAlign: 'center', opacity: .7 }}>No hay partes registrados.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
