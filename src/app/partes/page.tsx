import { supabaseAdmin } from '../../lib/supabaseAdmin';
import PartesTabla from '../../components/PartesTabla';

export const dynamic = 'force-dynamic';

function fmt(d?: string|null) {
  if (!d) return null;
  return d.includes('T') ? d.split('T')[0] : d;
}

export default async function PartesPage() {
  const sb = supabaseAdmin();

  // Últimos 50 partes (ajusta si necesitas paginación)
  const { data, error } = await sb
    .from('partes')
    .select(`
      id, fecha, hora_inicio, hora_fin, horas, comentario, tarea_id,
      expedientes ( codigo, proyecto )
    `)
    .order('fecha', { ascending: false })
    .order('hora_inicio', { ascending: false })
    .limit(50);

  if (error) {
    return (
      <main>
        <h2>Partes</h2>
        <p>Error al cargar: {error.message}</p>
      </main>
    );
  }

  // Normaliza para la tabla
  const filas = (data || []).map((r:any) => ({
    id: r.id as string,
    fecha: fmt(r.fecha),
    inicio: r.hora_inicio || '',
    fin: r.hora_fin || '',
    horas: r.horas ?? 0,
    comentario: r.comentario || '',
    expediente: r.expedientes ? `${r.expedientes.codigo || '—'} — ${r.expedientes.proyecto || '—'}` : '—',
    tarea_id: r.tarea_id as (string|null)
  }));

  return (
    <main>
      <h2>Partes</h2>
      <PartesTabla partesIniciales={filas}/>
    </main>
  );
}
