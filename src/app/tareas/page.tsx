import { createClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import FiltrosTareasGlobal from '@/components/FiltrosTareasGlobal';

type TareaRow = {
  id: number;
  expediente_id: number;
  titulo: string;
  horas_previstas: number | null;
  horas_realizadas: number | null;
  estado: string | null;
  prioridad: string | null;
  vencimiento: string | null;
  expedientes: { codigo: string } | null;
};

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const supabase = createClient();

  const q = (typeof searchParams.q === 'string' ? searchParams.q : '')?.trim();
  const estado = (typeof searchParams.estado === 'string' ? searchParams.estado : '')?.trim();
  const prioridad = (typeof searchParams.prioridad === 'string' ? searchParams.prioridad : '')?.trim();
  const ordenar = (typeof searchParams.ordenar === 'string' ? searchParams.ordenar : 'vencimiento')?.trim();

  let query = supabase
    .from('tareas')
    .select('id, expediente_id, titulo, horas_previstas, horas_realizadas, estado, prioridad, vencimiento, expedientes(codigo)');

  if (q) {
    query = query.or(`titulo.ilike.%${q}%`);
  }
  if (estado) query = query.eq('estado', estado);
  if (prioridad) query = query.eq('prioridad', prioridad);

  const orderMap: Record<string, { col: string; asc: boolean }> = {
    vencimiento: { col: 'vencimiento', asc: true },
    prioridad: { col: 'prioridad', asc: true },
  };
  const { col, asc } = orderMap[ordenar] || orderMap.vencimiento;
  query = query.order(col, { ascending: asc, nullsFirst: true });

  const { data, error } = await query;
  if (error) {
    return <div className="card"><h2 className="card-title">Tareas</h2><p style={{ color: 'crimson' }}>Error al cargar tareas: {error.message}</p></div>;
  }

  const tareas = (data || []) as unknown as TareaRow[];

  const fmt = (n: number | null | undefined) => (Number.isFinite(Number(n)) ? Number(n).toFixed(1) : '—');

  return (
    <>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-toolbar" style={{ justifyContent: 'space-between' }}>
          <h2 className="card-title">Tareas</h2>
          {/* No crear desde aquí (según tu criterio) */}
        </div>
        <FiltrosTareasGlobal />
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Expediente</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>Horas (Prev/Real)</th>
              <th style={{ textAlign: 'center', width: 90 }}>⋯</th>
            </tr>
          </thead>
          <tbody>
            {tareas.map((t) => (
              <tr key={t.id}>
                <td>{t.titulo}</td>
                <td>
                  {t.expedientes?.codigo ? (
                    <Link href={`/expedientes/${encodeURIComponent(t.expedientes.codigo)}`}>
                      {t.expedientes.codigo}
                    </Link>
                  ) : '—'}
                </td>
                <td>{t.vencimiento ?? '—'}</td>
                <td>{t.estado ?? '—'}</td>
                <td>{t.prioridad ?? '—'}</td>
                <td>{fmt(t.horas_previstas)} / <strong>{fmt(t.horas_realizadas)}</strong></td>
                <td style={{ textAlign: 'center' }}>
                  <Link className="icon-btn" href={`/tareas?edit=${t.id}`} title="Editar">✏️</Link>{' '}
                  <Link className="icon-btn" href={`/tareas?del=${t.id}`} title="Borrar">🗑️</Link>
                </td>
              </tr>
            ))}
            {tareas.length === 0 && (
              <tr><td colSpan={7} style={{ color: '#64748b', textAlign: 'center', padding: 18 }}>No hay tareas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
