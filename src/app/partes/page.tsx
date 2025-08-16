// src/app/partes/page.tsx
import { createClient } from '@/lib/supabaseServer';

type Parte = {
  id: number;
  fecha: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  comentario: string | null;
  expediente_id: number | null;
  tarea_id: number | null;
  expedientes: { id: number; codigo: string }[]; // via join
  tareas: { id: number; titulo: string }[];       // via join
};

type ExpedienteRef = { id: number; codigo: string };
type TareaRef = { id: number; titulo: string };

export const revalidate = 0; // evitar cache en build

export default async function PagePartes() {
  const supabase = createClient();

  // Partes + joins mínimos para mostrar referencias
  const { data: raw, error } = await supabase
    .from('partes')
    .select(`
      id, fecha, hora_inicio, hora_fin, comentario, expediente_id, tarea_id,
      expedientes ( id, codigo ),
      tareas ( id, titulo )
    `)
    .order('fecha', { ascending: false });

  if (error) {
    return (
      <main className="container">
        <h1>Partes</h1>
        <p className="text-danger">Error al cargar partes: {error.message}</p>
      </main>
    );
  }

  const partes: Parte[] = (raw || []) as any;

  // Opciones para selects de creación (solo expedientes activos y tareas visibles)
  const { data: exps } = await supabase
    .from('expedientes')
    .select('id,codigo')
    .neq('estado', 'Cerrado')
    .order('codigo', { ascending: true });

  const { data: tasks } = await supabase
    .from('tareas')
    .select('id,titulo')
    .order('titulo', { ascending: true });

  const expedientesOpts: ExpedienteRef[] = (exps || []) as any;
  const tareasOpts: TareaRef[] = (tasks || []) as any;

  return (
    <main className="container">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1>Partes</h1>
        {/* botón crear (emoji solo) */}
        {/* @ts-expect-error Server Component wraps Client Component */}
        <ClientParteButtons mode="create" expedientes={expedientesOpts} tareas={tareasOpts} onDone={() => { /* no-op en server */ }} />
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Expediente</th>
              <th>Tarea</th>
              <th>Comentario</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {partes.map((p) => {
              const ex = (p.expedientes && p.expedientes[0]) ? p.expedientes[0] : null;
              const ta = (p.tareas && p.tareas[0]) ? p.tareas[0] : null;
              return (
                <tr key={p.id}>
                  <td>{p.fecha ?? '—'}</td>
                  <td>{p.hora_inicio ?? '—'}</td>
                  <td>{p.hora_fin ?? '—'}</td>
                  <td>{ex ? <a className="link" href={`/expedientes/${encodeURIComponent(ex.codigo)}`}>{ex.codigo}</a> : '—'}</td>
                  <td>{ta ? ta.titulo : '—'}</td>
                  <td>{p.comentario ?? '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {/* @ts-expect-error Server Component wraps Client Component */}
                    <ClientParteButtons
                      mode="edit"
                      parte={p}
                      expedientes={expedientesOpts}
                      tareas={tareasOpts}
                      onDone={() => {}}
                    />
                    {/* separador mínimo */}
                    <span style={{ display: 'inline-block', width: 8 }} />
                    {/* @ts-expect-error Server Component wraps Client Component */}
                    <ClientParteButtons
                      mode="delete"
                      parte={p}
                      onDone={() => {}}
                    />
                  </td>
                </tr>
              );
            })}
            {partes.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 16 }}>
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

// Import tardío del client component para que Next no intente convertir la página a cliente
// (el comentario @ts-expect-error encima de su uso es a propósito).
import ClientParteButtons from '@/components/ClientParteButtons';
