// src/app/tareas/page.tsx
import { createClient } from '@/lib/supabaseServer';
import TareasClient from '@/components/TareasClient';

export const revalidate = 0; // siempre fresco en desarrollo

type Tarea = {
  id: number;
  expediente_id: number | null;
  titulo: string;
  horas_previstas: number | null;
  horas_realizadas: number | null;
  estado: string | null;
  prioridad: string | null;
  vencimiento: string | null;
};

type ExpedienteRef = {
  id: number;
  codigo: string;
  proyecto: string | null;
};

export default async function PageTareas() {
  const supabase = createClient();

  const { data: tareas, error: e1 } = await supabase
    .from('tareas')
    .select('id, expediente_id, titulo, horas_previstas, horas_realizadas, estado, prioridad, vencimiento')
    .order('vencimiento', { ascending: true, nullsFirst: true });

  if (e1) {
    console.error('Error cargando tareas:', e1.message);
    return <main className="container"><h1 className="page-title">Tareas</h1><p>Error cargando tareas.</p></main>;
  }

  const { data: expedientes, error: e2 } = await supabase
    .from('expedientes')
    .select('id, codigo, proyecto')
    .order('codigo', { ascending: true });

  if (e2) {
    console.error('Error cargando expedientes:', e2.message);
    return <main className="container"><h1 className="page-title">Tareas</h1><p>Error cargando expedientes.</p></main>;
  }

  return (
    <main className="container">
      <h1 className="page-title">Tareas</h1>
      <TareasClient tareas={(tareas ?? []) as Tarea[]} expedientes={(expedientes ?? []) as ExpedienteRef[]} />
    </main>
  );
}
