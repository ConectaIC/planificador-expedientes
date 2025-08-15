// src/app/partes/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import PartesTabla from '../../components/PartesTabla';

export default async function PartesPage() {
  const sb = supabaseAdmin();

  // Cargamos partes con expediente (codigo, proyecto) y tarea (titulo)
  const { data, error } = await sb
    .from('partes')
    .select(`
      id, fecha, inicio, fin, horas, comentario,
      expediente:expediente_id ( codigo, proyecto ),
      tarea:tarea_id ( titulo )
    `)
    .order('fecha', { ascending: false });

  if (error) {
    return (
      <main>
        <h2>Partes</h2>
        <p>Error al cargar: {error.message}</p>
      </main>
    );
  }

  // Adaptamos al tipo que espera PartesTabla
  const filas = (data || []).map((p: any) => {
    const exp =
      p.expediente?.codigo
        ? `${p.expediente.codigo} — ${p.expediente.proyecto ?? ''}`.trim()
        : '—';

    // Aseguramos formatos para el modal de edición
    const normTime = (t: any) => {
      if (!t) return '00:00:00';
      // si llega "HH:mm" lo normalizamos a "HH:mm:00"
      return String(t).length === 5 ? `${t}:00` : String(t);
    };

    return {
      id: p.id as string,
      fecha: (p.fecha ?? '').split('T')[0] || '', // "YYYY-MM-DD"
      inicio: normTime(p.inicio),
      fin: normTime(p.fin),
      horas: typeof p.horas === 'number' ? p.horas : Number(p.horas || 0),
      comentario: p.comentario ?? null,
      expediente: exp,
      tarea: p.tarea?.titulo ?? null,
    };
  });

  return (
    <main>
      <h2>Partes</h2>
      {/* 👇 OJO: aquí usamos la prop correcta que espera PartesTabla */}
      <PartesTabla partes={filas} />
    </main>
  );
}
