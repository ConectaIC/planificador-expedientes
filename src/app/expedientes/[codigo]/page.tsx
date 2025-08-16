import { createClient } from '@/lib/supabaseServer';
import Link from 'next/link';

type Expediente = {
  id: number;
  codigo: string;
  proyecto: string;
  cliente: string;
  prioridad: string | null;
  estado: string | null;
  inicio: string | null;
  fin: string | null;
  horas_previstas: number | null;
  horas_reales: number | null;
};

type Tarea = {
  id: number;
  expediente_id: number;
  titulo: string;
  horas_previstas: number | null;
  horas_realizadas: number | null;
  estado: string | null;
  prioridad: string | null;
  vencimiento: string | null;
};

export default async function Page({ params }: { params: { codigo: string } }) {
  const supabase = createClient();

  const { data: exp, error: e1 } = await supabase
    .from('expedientes')
    .select('*')
    .eq('codigo', decodeURIComponent(params.codigo))
    .maybeSingle();

  if (e1) {
    return <div className="card"><p style={{ color: 'crimson' }}>Error al cargar expediente: {e1.message}</p></div>;
  }
  if (!exp) {
    return <div className="card"><p>No existe el expediente “{decodeURIComponent(params.codigo)}”.</p></div>;
  }

  const expediente = exp as Expediente;

  const { data: tareas, error: e2 } = await supabase
    .from('tareas')
    .select('id, expediente_id, titulo, horas_previstas, horas_realizadas, estado, prioridad, vencimiento')
    .eq('expediente_id', expediente.id)
    .order('vencimiento', { ascending: true, nullsFirst: true });

  if (e2) {
    return <div className="card"><p style={{ color: 'crimson' }}>Error al cargar tareas: {e2.message}</p></div>;
  }

  const lista = (tareas || []) as Tarea[];

  const fmt = (n: number | null | undefined) => (Number.isFinite(Number(n)) ? Number(n).toFixed(1) : '—');

  return (
    <>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-toolbar" style={{ justifyContent: 'space-between' }}>
          <h2 className="card-title">Expediente · {expediente.codigo}</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/expedientes" className="btn-ghost">← Volver</Link>
            <Link href={`/expedientes/${encodeURIComponent(expediente.codigo)}?nuevaTarea=1`} className="icon-btn" aria-label="Nueva tarea" title="Nueva tarea">➕</Link>
          </div>
        </div>
        <div style={{ color: '#475569' }}>
          <div><strong>Proyecto:</strong> {expediente.proyecto} · <strong>Cliente:</strong> {expediente.cliente}</div>
          <div><strong>Estado:</strong> {expediente.estado ?? '—'} · <strong>Prioridad:</strong> {expediente.prioridad ?? '—'}</div>
          <div><strong>Horas:</strong> {fmt(expediente.horas_previstas)} / <strong>{fmt(expediente.horas_reales)}</strong></div>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>Horas (Prev/Real)</th>
              <th style={{ textAlign: 'center', width: 90 }}>⋯</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((t) => (
              <tr key={t.id}>
                <td>{t.titulo}</td>
                <td>{t.vencimiento ?? '—'}</td>
                <td>{t.estado ?? '—'}</td>
                <td>{t.prioridad ?? '—'}</td>
                <td>{fmt(t.horas_previstas)} / <strong>{fmt(t.horas_realizadas)}</strong></td>
                <td style={{ textAlign: 'center' }}>
                  {/* Aquí puedes usar tu componente cliente de acciones de tareas si ya existe */}
                  <Link className="icon-btn" href={`/tareas?edit=${t.id}`} title="Editar">✏️</Link>{' '}
                  <Link className="icon-btn" href={`/tareas?del=${t.id}`} title="Borrar">🗑️</Link>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr><td colSpan={6} style={{ color: '#64748b', textAlign: 'center', padding: 18 }}>No hay tareas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
