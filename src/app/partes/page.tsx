// src/app/partes/page.tsx
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import PartesUI from '../../components/PartesUI';

export default async function PartesPage() {
  const sb = supabaseAdmin();

  // Expedientes para el selector (id, codigo, proyecto)
  const { data: expedientes, error: errExp } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto')
    .order('codigo', { ascending: true });

  // Tareas para construir el mapa id -> título (PartesUI muestra el título de la tarea)
  const { data: tareas, error: errTar } = await sb
    .from('tareas')
    .select('id, titulo')
    .order('titulo', { ascending: true });

  // Últimos partes para listar inicialmente (PartesUI también permite crear/editar/borrar)
  const { data: partes, error: errPar } = await sb
    .from('partes')
    .select('id, fecha, hora_inicio, hora_fin, horas, comentario, expediente_id, tarea_id')
    .order('fecha', { ascending: false })
    .order('hora_inicio', { ascending: false })
    .limit(100);

  if (errExp || errTar || errPar) {
    return (
      <main style={{ padding: 16 }}>
        <h2>Partes</h2>
        {errExp && <p>Error al cargar expedientes: {errExp.message}</p>}
        {errTar && <p>Error al cargar tareas: {errTar.message}</p>}
        {errPar && <p>Error al cargar partes: {errPar.message}</p>}
      </main>
    );
  }

  // Construir mapa { tareaId: titulo }
  const mapTareaTitulos: Record<string, string> = {};
  (tareas || []).forEach((t: any) => {
    if (t?.id) mapTareaTitulos[String(t.id)] = String(t.titulo ?? '');
  });

  return (
    <main style={{ padding: 16 }}>
      <h2>Partes</h2>
      <PartesUI
        expedientes={(expedientes || []) as any}
        partesIniciales={(partes || []) as any}
        mapTareaTitulos={mapTareaTitulos}
      />
    </main>
  );
}
