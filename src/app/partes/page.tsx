// src/app/partes/page.tsx
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import PartesUI from '../../components/PartesUI';

export default async function PartesPage() {
  const sb = supabaseAdmin();

  const { data: expedientes, error: e1 } = await sb
    .from('expedientes')
    .select('id,codigo,proyecto')
    .order('codigo', { ascending: true });
  if (e1) {
    return (
      <main>
        <h2>Partes</h2>
        <p>Error al cargar expedientes: {e1.message}</p>
      </main>
    );
  }

  const { data: partes, error: e2 } = await sb
    .from('partes')
    .select('id, fecha, hora_inicio, hora_fin, horas, comentario, expediente_id, tarea_id')
    .order('fecha', { ascending: false })
    .limit(100);
  if (e2) {
    return (
      <main>
        <h2>Partes</h2>
        <p>Error al cargar: {e2.message}</p>
      </main>
    );
  }

  // Títulos de tareas referenciadas
  const tareaIds = Array.from(new Set((partes || []).map(p=>p.tarea_id).filter((v): v is string => !!v)));
  let mapTareaTitulos: Record<string,string> = {};
  if (tareaIds.length) {
    const { data: tareas } = await sb.from('tareas').select('id,titulo').in('id', tareaIds);
    mapTareaTitulos = Object.fromEntries((tareas||[]).map(t=>[t.id, t.titulo]));
  }

  return (
    <main>
      <h2>Partes</h2>
      <PartesUI
        expedientes={expedientes || []}
        partesIniciales={partes || []}
        mapTareaTitulos={mapTareaTitulos}
      />
    </main>
  );
}
