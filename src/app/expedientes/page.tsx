// src/app/expedientes/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';

// Componentes existentes
import TareasDeExpedienteModal from '../../components/TareasDeExpedienteModal';
import NuevoExpediente from '../../components/NuevoExpediente';

export default async function ExpedientesPage() {
  const sb = supabaseAdmin();

  // Expedientes (listado principal)
  const { data: expedientes, error: errE } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto, cliente, fecha_inicio, fin, prioridad')
    .order('codigo', { ascending: true });

  // Tareas (para el modal Tareas… filtraremos por expediente_id dentro del propio modal)
  const { data: tareas, error: errT } = await sb
    .from('tareas')
    .select('id, titulo, expediente_id, vencimiento, estado, tipo, horas_previstas')
    .order('titulo', { ascending: true });

  if (errE || errT) {
    return (
      <main style={{ padding: 16 }}>
        <h2>Expedientes</h2>
        {errE && <p>Error al cargar expedientes: {errE.message}</p>}
        {errT && <p>Error al cargar tareas: {errT.message}</p>}
      </main>
    );
  }

  // Estilos básicos
  const main: React.CSSProperties = { padding: 16 };
  const header: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  };
  const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
  const th: React.CSSProperties = {
    textAlign: 'left', borderBottom: '1px solid var(--cic-border, #e5e5e5)', padding: '8px 6px', fontWeight: 600,
  };
  const td: React.CSSProperties = { borderBottom: '1px solid var(--cic-border, #f0f0f0)', padding: '8px 6px' };
  const actionsCell: React.CSSProperties = { ...td, textAlign: 'right', whiteSpace: 'nowrap' };
  const btnRow: React.CSSProperties = { display: 'inline-flex', gap: 6, alignItems: 'center' };

  return (
    <main style={main}>
      <div style={header}>
        <h2>Expedientes</h2>
        {/* Alta en modal — componente existente */}
        <NuevoExpediente />
      </div>

      <table style={tbl}>
        <thead>
          <tr>
            <th style={th}>Código</th>
            <th style={th}>Proyecto</th>
            <th style={th}>Cliente</th>
            <th style={th}>Prioridad</th>
            <th style={th}>Inicio</th>
            <th style={th}>Fin</th>
            <th style={th} />
          </tr>
        </thead>
        <tbody>
          {(expedientes || []).map((e) => (
            <tr key={e.id}>
              <td style={td}>{e.codigo || '—'}</td>
              <td style={td}>{e.proyecto || '—'}</td>
              <td style={td}>{e.cliente || '—'}</td>
              <td style={td}>{e.prioridad || '—'}</td>
              <td style={td}>{e.fecha_inicio || '—'}</td>
              <td style={td}>{e.fin || '—'}</td>
              <td style={actionsCell}>
                <span style={btnRow}>
                  {/* Modal de tareas vinculadas — componente existente */}
                  <TareasDeExpedienteModal
                    expediente={e as any}
                    expedientes={(expedientes || []) as any}
                    tareas={(tareas || []) as any}
                    onChanged={async () => { /* SSR: refresco por navegación cuando sea necesario */ }}
                  />
                  {/* TODO: Añadir botón de edición (wrapper cliente) en siguiente iteración */}
                </span>
              </td>
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
