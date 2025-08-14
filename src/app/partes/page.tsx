// src/app/partes/page.tsx
export const dynamic = 'force-dynamic'; // <- evita que quede estático/ cacheado

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import PartesTabla from '../../components/PartesTabla';

function fmt(d?: string|null){
  if (!d) return '—';
  const iso = d.includes('T') ? d.split('T')[0] : d;
  const [y,m,dd] = iso.split('-');
  return `${dd}/${m}/${y}`;
}

export default async function PartesPage() {
  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from('partes')
    .select('id, fecha, hora_inicio, hora_fin, horas, comentario, expediente_id, tarea_id')
    .order('fecha', { ascending: false });

  if (error) {
    return (
      <main>
        <h2>Partes</h2>
        <p>Error al cargar: {error.message}</p>
      </main>
    );
  }

  // cargamos expedientes para mostrar código + proyecto
  const expIds = Array.from(new Set((data||[]).map(p => p.expediente_id).filter(Boolean)));
  const { data: exps } = expIds.length
    ? await sb.from('expedientes')
        .select('id, codigo, proyecto')
        .in('id', expIds)
    : { data: [] as any[] };

  const mapExp = new Map((exps||[]).map(e => [e.id, e]));
  const filas = (data||[]).map(p => ({
    id: p.id as string,
    fecha: fmt(p.fecha as string),
    ini: (p.hora_inicio as string)||'—',
    fin: (p.hora_fin as string)||'—',
    horas: Number(p.horas||0),
    comentario: p.comentario || '',
    expediente: (() => {
      const e = p.expediente_id ? mapExp.get(p.expediente_id) : null;
      return e ? `${e.codigo} — ${e.proyecto||''}` : '—';
    })(),
    tarea_id: p.tarea_id as string | null
  }));

  return (
    <main>
      <h2>Partes</h2>
      <PartesTabla filasIniciales={filas} />
    </main>
  );
}
