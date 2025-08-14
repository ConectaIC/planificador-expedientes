// src/app/tareas/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import FiltrosTareasGlobal from '../../components/FiltrosTareasGlobal';

type RelExp = { codigo?: string | null; proyecto?: string | null };
type Row = {
  id: string;
  titulo: string;
  estado?: string | null;
  prioridad?: string | null;
  horas_previstas?: number | null;
  horas_realizadas?: number | null;
  vencimiento?: string | null;
  expedientes?: RelExp | RelExp[] | null;
};

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

  // Normalizamos: si expedientes viene como array, tomamos el primer elemento
  const normalizadas = (data as Row[] | null | undefined)?.map((r) => ({
    ...r,
    expedientes: Array.isArray(r.expedientes)
      ? (r.expedientes[0] ?? null)
      : r.expedientes ?? null,
  })) ?? [];

  return (
    <main>
      <h2>Todas las tareas</h2>
      <FiltrosTareasGlobal tareas={normalizadas as any} />
    </main>
  );
}
