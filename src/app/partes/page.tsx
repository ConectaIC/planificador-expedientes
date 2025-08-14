export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import PartesTabla from '../../components/PartesTabla';

export default async function PartesPage() {
  const sb = supabaseAdmin();

  // Partes + joins ligeros para mostrar códigos y títulos
  const { data: partes, error: eP } = await sb
    .from('partes')
    .select(`
      id, fecha, inicio, fin, horas, comentario, expediente_id, tarea_id,
      expediente:expediente_id ( codigo ),
      tarea:tarea_id ( titulo )
    `)
    .order('fecha', { ascending: false })
    .order('inicio', { ascending: false });

  // Expedientes para selects
  const { data: exps } = await sb
    .from('expedientes')
    .select('id, codigo');

  // Tareas por expediente (para selects dependientes)
  const tareasPorExpediente: Record<string, { id:string; titulo:string }[]> = {};
  if (exps && exps.length) {
    const { data: tareasAll } = await sb
      .from('tareas')
      .select('id, titulo, expediente_id');
    (tareasAll||[]).forEach(t=>{
      const k = t.expediente_id as string;
      if (!k) return;
      tareasPorExpediente[k] ||= [];
      tareasPorExpediente[k].push({ id:t.id, titulo:t.titulo });
    });
  }

  if (eP) {
    return <main><h2>Partes</h2><p>Error al cargar: {eP.message}</p></main>;
  }

  return (
    <main>
      <div style={{display:'flex', alignItems:'center', gap:12}}>
        <h2 style={{margin:0}}>Partes (Imputación de horas)</h2>
        <a href="/tareas"><button>📝 Ver todas las tareas</button></a>
      </div>

      <p>Total registros: {partes?.length ?? 0}</p>

      <PartesTabla
        partesIniciales={(partes as any[]) || []}
        expedientes={(exps as any[]) || []}
        tareasPorExpediente={tareasPorExpediente}
      />
    </main>
  );
}
