// src/app/partes/page.tsx
// Tipo: Server Component

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import NewParteModal from '../../components/NewParteModal';
import PartesTabla from '../../components/PartesTabla';

type ExpedienteMini = { id: number; codigo: string; proyecto?: string | null };
type TareaMini = { id: number; titulo: string; expediente_id: number };

type ParteRow = {
  id: number;
  fecha: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  horas: number | null;
  comentario: string | null;
  expediente: { id: number; codigo: string } | null;
  tarea: { id: number; titulo: string } | null;
};

function firstOrNull<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const q = (k: string) => {
    const v = searchParams?.[k];
    return Array.isArray(v) ? v[0] : v || '';
  };
  const ordenar = (q('orden') || 'fecha_desc').trim();

  const sb = supabaseAdmin();

  const [{ data: exps }, { data: ts }] = await Promise.all([
    sb.from('expedientes').select('id,codigo,proyecto').order('codigo', { ascending: true }),
    sb.from('tareas').select('id,titulo,expediente_id').order('id', { ascending: true }),
  ]);

  let query = sb
    .from('partes')
    .select('id,fecha,hora_inicio,hora_fin,horas,comentario,expedientes(id,codigo),tareas(id,titulo)');

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

  const partes: ParteRow[] = (data || []).map((p: any) => {
    const exp = firstOrNull<any>(p.expedientes);
    const tarea = firstOrNull<any>(p.tareas);
    return {
      id: Number(p.id),
      fecha: p.fecha ?? null,
      hora_inicio: p.hora_inicio ?? null,
      hora_fin: p.hora_fin ?? null,
      horas: p.horas ?? null,
      comentario: p.comentario ?? null,
      expediente: exp ? { id: Number(exp.id), codigo: String(exp.codigo) } : null,
      tarea: tarea ? { id: Number(tarea.id), titulo: String(tarea.titulo) } : null,
    };
  });

  return (
    <main className="container">
      <div
        className="card"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
      >
        <h1>Partes</h1>
        <NewParteModal
          expedientes={(exps || []) as ExpedienteMini[]}
          tareas={(ts || []) as TareaMini[]}
        />
      </div>

      <PartesTabla partes={partes as any} />
    </main>
  );
}
