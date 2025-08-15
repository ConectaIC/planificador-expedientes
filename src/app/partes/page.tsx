// src/app/partes/page.tsx
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import PartesTabla from '../../components/PartesTabla';

function fmt(d?: string|null) {
  if (!d) return null;
  return d.includes('T') ? d.split('T')[0] : d;
}

export default async function PartesPage() {
  const sb = supabaseAdmin();

  // Últimos 50 partes (con expediente y título de tarea)
  const { data, error } = await sb
    .from('partes')
    .select(`
      id, fecha, hora_inicio, hora_fin, horas, comentario, tarea_id,
      expedientes ( codigo, proyecto ),
      tarea:tarea_id ( titulo )
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
    fecha: fmt(r.fecha) || '',
    inicio: r.hora_inicio || '',
    fin: r.hora_fin || '',
    horas: typeof r.horas === 'number' ? r.horas : Number(r.horas || 0),
    comentario: r.comentario || '',
    expediente: r.expedientes ? `${r.expedientes.codigo || '—'} — ${r.expedientes.proyecto || '—'}` : '—',
    tarea: r.tarea?.titulo ?? null
  }));

  return (
    <main>
      <h2>Partes</h2>
      {/* 👇 Prop correcta */}
      <PartesTabla partes={filas}/>
    </main>
  );
}
