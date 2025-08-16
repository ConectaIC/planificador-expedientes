import { createClient } from '@supabase/supabase-js';

type Row = {
  id: number;
  expediente_id: number;
  titulo: string;
  horas_previstas?: number | null;
  horas_realizadas?: number | null;
  estado?: 'Pendiente' | 'En curso' | 'Completada';
  prioridad?: 'Baja' | 'Media' | 'Alta';
  vencimiento?: string | null;
  expedientes?: { codigo: string } | { codigo: string }[] | null;
};

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

function one<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

async function fetchTareas(q?: string, estado?: string, prioridad?: string, orden?: string) {
  const supa = getAdmin();
  let query = supa
    .from('tareas')
    .select('id, expediente_id, titulo, horas_previstas, horas_realizadas, estado, prioridad, vencimiento, expedientes(codigo)');

  if (q && q.trim()) {
    query = query.or(`titulo.ilike.%${q}%`);
  }
  if (estado && estado !== 'Todos') query = query.eq('estado', estado);
  if (prioridad && prioridad !== 'Todas') query = query.eq('prioridad', prioridad);

  switch (orden) {
    case 'vencimiento':
      query = query.order('vencimiento', { ascending: true, nullsFirst: true });
      break;
    case 'prioridad':
      query = query.order('prioridad', { ascending: false, nullsFirst: true });
      break;
    default:
      query = query.order('id', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw new Error(`Error al cargar tareas: ${error.message}`);
  return (data ?? []) as Row[];
}

export default async function Page({ searchParams }: { searchParams: any }) {
  const q = searchParams?.q ?? '';
  const estado = searchParams?.estado ?? 'Todos';
  const prioridad = searchParams?.prioridad ?? 'Todas';
  const orden = searchParams?.orden ?? 'vencimiento';

  const rows = await fetchTareas(q, estado, prioridad, orden);

  return (
    <main className="container">
      <div className="toolbar">
        <form method="get" className="filters">
          <input name="q" placeholder="Buscar por título" defaultValue={q} className="input" />
          <select name="estado" defaultValue={estado} className="input" onChange={(e)=> e.currentTarget.form?.submit()}>
            <option>Todos</option>
            <option>Pendiente</option>
            <option>En curso</option>
            <option>Completada</option>
          </select>
          <select name="prioridad" defaultValue={prioridad} className="input" onChange={(e)=> e.currentTarget.form?.submit()}>
            <option>Todas</option>
            <option>Baja</option>
            <option>Media</option>
            <option>Alta</option>
          </select>
          <select name="orden" defaultValue={orden} className="input" onChange={(e)=> e.currentTarget.form?.submit()}>
            <option value="vencimiento">Ordenar: Vencimiento</option>
            <option value="prioridad">Ordenar: Prioridad</option>
            <option value="id">Ordenar: Recientes</option>
          </select>
        </form>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Expediente</th>
            <th>Previstas</th>
            <th>Realizadas</th>
            <th>Estado</th>
            <th>Prioridad</th>
            <th>Vencimiento</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const exp = one(t.expedientes);
            return (
              <tr key={t.id}>
                <td>{t.titulo}</td>
                <td>{exp?.codigo ?? '—'}</td>
                <td>{Number(t.horas_previstas ?? 0).toFixed(2)}</td>
                <td>{Number(t.horas_realizadas ?? 0).toFixed(2)}</td>
                <td>{t.estado ?? '—'}</td>
                <td>{t.prioridad ?? '—'}</td>
                <td>{t.vencimiento ?? '—'}</td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: 16 }}>No hay tareas.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
