// src/app/partes/page.tsx  (NO poner 'use client' aquí)
import { createClient } from '@/lib/supabaseServer'; // o tu helper actual
import { CreateParteButton, EditParteButton, DeleteParteButton } from '@/components/ClientParteButtons';
// ...tus imports server de siempre

export default async function PagePartes() {
  const supabase = createClient();

  // Carga de datos (server)
  // - partes desde la vista v_partes (recomendada) o tu query actual
  // - referencias mínimas de expedientes y tareas para los selects de los modales
  const { data: expedientesRefs } = await supabase
    .from('expedientes')
    .select('id,codigo')
    .order('codigo');

  const { data: tareasRefs } = await supabase
    .from('tareas')
    .select('id,titulo')
    .order('titulo');

  const { data: partesData } = await supabase
    .from('v_partes')
    .select('*')
    .order('fecha', { ascending: false });

  const expedientes = (expedientesRefs || []) as { id: number; codigo: string }[];
  const tareas = (tareasRefs || []) as { id: number; titulo: string }[];
  const partes = (partesData || []) as any[];

  return (
    <main className="container">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Partes</h2>
        {/* Botón NUEVO parte (emoji) */}
        <CreateParteButton expedientes={expedientes} tareas={tareas} />
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Expediente</th>
              <th>Tarea</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Horas</th>
              <th>Comentario</th>
              <th style={{ textAlign: 'center', width: 96 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {partes.map((p) => (
              <tr key={p.id}>
                <td>{p.fecha ?? '—'}</td>
                <td>{p.expediente_codigo ?? p.expediente_id}</td>
                <td>{p.tarea_titulo ?? '—'}</td>
                <td>{p.hora_inicio ?? '—'}</td>
                <td>{p.hora_fin ?? '—'}</td>
                <td>{p.horas ?? '—'}</td>
                <td>{p.comentario ?? '—'}</td>
                <td style={{ textAlign: 'center' }}>
                  <div className="flex gap-2 items-center" style={{ justifyContent: 'center' }}>
                    <EditParteButton
                      parte={{
                        id: p.id,
                        fecha: p.fecha,
                        hora_inicio: p.hora_inicio,
                        hora_fin: p.hora_fin,
                        comentario: p.comentario,
                        expediente_id: p.expediente_id,
                        tarea_id: p.tarea_id,
                      }}
                      expedientes={expedientes}
                      tareas={tareas}
                    />
                    <DeleteParteButton id={p.id} />
                  </div>
                </td>
              </tr>
            ))}
            {(!partes || partes.length === 0) && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 16 }}>
                  No hay partes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

/* IMPORTANTE:
   - NO pongas ningún 'use client' ni useState en este archivo.
   - Toda la interacción (abrir/cerrar modales) ya vive en ClientParteButtons.tsx
*/
