// src/app/tareas/page.tsx
// Tipo: Server Component

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import TareaRowActions from '../../components/TareaRowActions';
import FiltrosTareasGlobal from '../../components/FiltrosTareasGlobal';

type ExpedienteMini = { id: number; codigo: string; proyecto?: string | null };

type TareaRow = {
  id: number;
  titulo: string;
  expediente_id: number;
  horas_previstas: number | null;
  horas_realizadas: number | null;
  estado: string | null;
  prioridad: string | null;
  vencimiento: string | null;
  expediente: { codigo: string } | null;
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

  const ordenar = (q('orden') || 'vencimiento_asc').trim();
  const estado = q('estado');
  const prioridad = q('prioridad');
  const busqueda = q('q');

  const sb = supabaseAdmin();

  const [{ data: exps }, tareasRes] = await Promise.all([
    sb.from('expedientes').select('id,codigo,proyecto').order('codigo', { ascending: true }),
    (async () => {
      let query = sb
        .from('tareas')
        .select(
          'id,titulo,expediente_id,horas_previstas,horas_realizadas,estado,prioridad,vencimiento,expedientes(codigo)'
        );

      if (estado) query = query.eq('estado', estado);
      if (prioridad) query = query.eq('prioridad', prioridad);
      if (busqueda) {
        // búsqueda básica por título (y por código de expediente a través de relación)
        query = query.ilike('titulo', `%${busqueda}%`);
      }

      const orderSpec =
        ordenar === 'vencimiento_desc'
          ? { column: 'vencimiento', ascending: false as const }
          : ordenar === 'prioridad_desc'
          ? { column: 'prioridad', ascending: false as const }
          : ordenar === 'prioridad_asc'
          ? { column: 'prioridad', ascending: true as const }
          : ordenar === 'titulo_desc'
          ? { column: 'titulo', ascending: false as const }
          : ordenar === 'titulo_asc'
          ? { column: 'titulo', ascending: true as const }
          : // por defecto
            { column: 'vencimiento', ascending: true as const };

      return query.order(orderSpec.column, { ascending: orderSpec.ascending });
    })(),
  ]);

  const { data, error } = tareasRes;
  if (error) {
    return (
      <main className="container">
        <h1>Tareas</h1>
        <div className="error">Error al cargar tareas: {error.message}</div>
      </main>
    );
  }

  const expedientes = (exps || []) as ExpedienteMini[];

  const tareas: TareaRow[] = (data || []).map((t: any) => {
    const exp = firstOrNull<any>(t.expedientes);
    return {
      id: Number(t.id),
      titulo: String(t.titulo ?? ''),
      expediente_id: Number(t.expediente_id),
      horas_previstas: t.horas_previstas ?? null,
      horas_realizadas: t.horas_realizadas ?? null,
      estado: t.estado ?? null,
      prioridad: t.prioridad ?? null,
      vencimiento: t.vencimiento ?? null,
      expediente: exp ? { codigo: String(exp.codigo) } : null,
    };
  });

  const fmtH = (n: any) => (Number.isFinite(Number(n)) ? Number(n).toFixed(2) : '—');

  return (
    <main className="container">
      <div className="card" style={{ marginBottom: 12 }}>
        <h1>Tareas</h1>
        <p className="muted">Listado global (la creación de tareas se realiza desde el expediente).</p>
      </div>

      {/* Barra de filtros (client) */}
      <FiltrosTareasGlobal />

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ minWidth: 160 }}>Título</th>
              <th>Expediente</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>Vencimiento</th>
              <th>Previstas</th>
              <th>Realizadas</th>
              <th style={{ width: 100, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tareas.map((t) => (
              <tr key={t.id}>
                <td>{t.titulo}</td>
                <td>{t.expediente?.codigo || '—'}</td>
                <td>{t.estado || '—'}</td>
                <td>{t.prioridad || '—'}</td>
                <td>{t.vencimiento || '—'}</td>
                <td style={{ textAlign: 'right' }}>{fmtH(t.horas_previstas)}</td>
                <td style={{ textAlign: 'right' }}>{fmtH(t.horas_realizadas)}</td>
                <td style={{ textAlign: 'center' }}>
                  {/* Acciones en modal */}
                  <TareaRowActions
                    tarea={{
                      id: t.id,
                      titulo: t.titulo,
                      expediente_id: t.expediente_id,
                      horas_previstas: t.horas_previstas,
                      horas_realizadas: t.horas_realizadas,
                      estado: t.estado,
                      prioridad: t.prioridad,
                      vencimiento: t.vencimiento,
                    }}
                    expedientes={expedientes}
                    onUpdate={async (fd) => {
                      'use server';
                      const sb2 = supabaseAdmin();
                      const id = Number(fd.get('id'));
                      const payload = {
                        titulo: String(fd.get('titulo') || ''),
                        expediente_id: Number(fd.get('expediente_id')),
                        horas_previstas: Number(fd.get('horas_previstas') || 0),
                        horas_realizadas: Number(fd.get('horas_realizadas') || 0),
                        estado: String(fd.get('estado') || ''),
                        prioridad: String(fd.get('prioridad') || ''),
                        vencimiento: String(fd.get('vencimiento') || '') || null,
                      };
                      const { error: eUp } = await sb2.from('tareas').update(payload).eq('id', id);
                      if (eUp) throw new Error(eUp.message);
                    }}
                    onDelete={async (fd) => {
                      'use server';
                      const sb2 = supabaseAdmin();
                      const id = Number(fd.get('id'));
                      const { error: eDel } = await sb2.from('tareas').delete().eq('id', id);
                      if (eDel) throw new Error(eDel.message);
                    }}
                  />
                </td>
              </tr>
            ))}
            {tareas.length === 0 && (
              <tr>
                <td colSpan={8} className="muted" style={{ textAlign: 'center', padding: 16 }}>
                  No hay tareas con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
