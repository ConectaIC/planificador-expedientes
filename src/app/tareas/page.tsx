// Server Component
import { createClient } from '@/lib/supabaseServer';

type Tarea = {
  id: number;
  expediente_id: number | null;
  titulo: string;
  horas_previstas: number | null;
  horas_realizadas: number | null;
  estado: string | null;
  prioridad: string | null;
  vencimiento: string | null; // date
};

type ExpedienteRef = { id: number; codigo: string };

export default async function PageTareas() {
  const supabase = createClient();

  const { data: tareas, error: e1 } = await supabase
    .from('tareas')
    .select('id, expediente_id, titulo, horas_previstas, horas_realizadas, estado, prioridad, vencimiento')
    .order('vencimiento', { ascending: true, nullsFirst: true });

  if (e1) {
    return (
      <main className="container">
        <h1 className="page-title">Tareas</h1>
        <p className="text-red-600">Error al cargar tareas: {e1.message}</p>
      </main>
    );
  }

  const { data: expedientes } = await supabase
    .from('expedientes')
    .select('id, codigo');

  return (
    <main className="container">
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Tareas</h1>
      </div>

      <TareasClient tareas={tareas ?? []} expedientes={expedientes ?? []} />
    </main>
  );
}

/**
 * Importa el componente cliente desde /components
 * (no declares "use client" dentro de este archivo)
 */
import TareasClient from '@/components/TareasClient';
