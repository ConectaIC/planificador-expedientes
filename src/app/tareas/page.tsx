export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import FiltrosTareasGlobal from '../../components/FiltrosTareasGlobal';

export default async function TareasGlobalPage() {
  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from('tareas')
    .select(`
      id, titulo, estado, prioridad, horas_previstas, horas_realizadas, vencimiento,
      expedientes:expediente_id ( codigo, proyecto )
    `)
    .order('vencimiento', { ascending: true });

  if (error) {
    return (
      <main>
        <h2>Tareas</h2>
        <p>Error al cargar: {error.message}</p>
      </main>
    );
  }

  return (
    <main>
      <h2>Todas las tareas</h2>
      <FiltrosTareasGlobal tareas={data || []} />
    </main>
  );
}
