// src/app/partes/page.tsx
// Tipo: Server Component

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import NewParteModal from '../../components/NewParteModal';
import PartesTabla from '../../components/PartesTabla';

type Parte = {
  id: number;
  fecha: string | null;
  inicio: string | null;
  fin: string | null;
  horas: number | null;
  comentario: string | null;
  expedientes: { id: number; codigo: string } | null;
  tareas: { id: number; titulo: string } | null;
};

export default async function Page({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const q = (k: string) => {
    const v = searchParams?.[k];
    return Array.isArray(v) ? v[0] : v || '';
  };
  const ordenar = q('orden')?.trim() || 'fecha_desc';

  const sb = supabaseAdmin();

  // Datos para modal de creación
  const [{ data: exps }, { data: ts }] = await Promise.all([
    sb.from('expedientes').select('id,codigo,proyecto').order('codigo', { ascending: true }),
    sb.from('tareas').select('id,titulo,expediente_id').order('id', { ascending: true }),
  ]);

  let query = sb
    .from('partes')
    .select('id,fecha,inicio,fin,horas,comentario,expedientes(id,codigo),tareas(id,titulo)');

  const [campo, dir] = (() => {
    switch (ordenar) {
      case 'fecha_asc':
        return ['fecha', { ascending: true as const }];
      case 'fecha_desc':
      default:
        return ['fecha', { ascending: false as const }];
    }
  })();

  const { data, error } = await query.order(campo, dir);
  if (error) {
    return (
      <main className="container">
        <h1>Partes</h1>
        <div className="error">Error al cargar partes: {error.message}</div>
      </main>
    );
  }

  const partes = (data || []) as Parte[];

  // Adaptamos a interfaz de PartesTabla
  const filas = partes.map((p) => ({
    id: p.id,
    fecha: p.fecha || null,
    inicio: p.inicio || null,
    fin: p.fin || null,
    horas: p.horas ?? null,
    comentario: p.comentario || null,
    expediente: p.expedientes ? { id: p.expedientes.id, codigo: p.expedientes.codigo } : null,
    tarea: p.tareas ? { id: p.tareas.id, titulo: p.tareas.titulo } : null,
  }));

  return (
    <main className="container">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1>Partes</h1>
        <NewParteModal expedientes={(exps || []) as any} tareas={(ts || []) as any} />
      </div>

      <PartesTabla partes={filas as any} />
    </main>
  );
}
