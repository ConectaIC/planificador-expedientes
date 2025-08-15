// src/app/tareas/page.tsx
// Tipo: Server Component

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import FiltrosTareasGlobal from '../../components/FiltrosTareasGlobal';
import TareaRowActions from '../../components/TareaRowActions';

type Tarea = {
  id: number;
  titulo: string;
  expediente_id: number;
  estado: string | null;
  prioridad: string | null;
  horas_previstas: number | null;
  horas_realizadas: number | null;
  vencimiento: string | null;
  expedientes?: { codigo: string } | null;
};

function fmt(n: any) {
  const v = Number(n);
  return Number.isFinite(v) ? v.toFixed(2) : '—';
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

  const texto = q('q')?.trim() || '';
  const estado = q('estado')?.trim() || '';
  const prioridad = q('prioridad')?.trim() || '';
  const ordenar = q('orden')?.trim() || 'vencimiento_asc';

  const sb = supabaseAdmin();

  // datos para selector de expediente en el formulario de edición
  const { data: expsMini } = await sb.from('expedientes').select('id,codigo,proyecto').order('codigo', { ascending: true });

  let query = sb
    .from('tareas')
    .select('id,titulo,expediente_id,estado,prioridad,horas_previstas,horas_realizadas,vencimiento,expedientes(codigo)');

  if (texto) query = query.or(`titulo.ilike.%${texto}%,expedientes.codigo.ilike.%${texto}%`);
  if (estado) query = query.eq('estado', estado);
  if (prioridad) query = query.eq('prioridad', prioridad);

  const [campo, dir] = (() => {
    switch (ordenar) {
      case 'vencimiento_desc':
        return ['vencimiento', { ascending: false as const }];
      case 'vencimiento_asc':
      default:
        return ['vencimiento', { ascending: true as const }];
    }
  })();

  const { data, error } = await query.order(campo, dir);
  if (error) {
    return (
      <main className="container">
        <h1>Tareas</h1>
        <div className="error">Error al cargar tareas: {error.message}</div>
      </main>
    );
  }

  const tareas = (data || []) as Tarea[];

  return (
    <main className="container">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1>Tareas</h1>
        {/* Esta vista NO crea tareas. Alta desde el expediente */}
      </div>

      <FiltrosTareasGlobal />

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Expediente</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>Vencimiento</th>
              <th>Horas (real / prev.)</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tareas.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>No hay tareas que cumplan el filtro.</td>
              </tr>
            ) : (
              tareas.map((t) => (
                <tr key={t.id}>
                  <td>{t.titulo}</td>
                  <td>{t.expedientes?.codigo || '—'}</td>
                  <td>{t.estado || '—'}</td>
                  <td>{t.prioridad || '—'}</td>
                  <td>{t.vencimiento ? new Date(t.vencimiento).toLocaleDateString('es-ES') : '—'}</td>
                  <td><strong>{fmt(t.horas_realizadas)}</strong> / {fmt(t.horas_previstas)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <TareaRowActions tarea={t as any} expedientes={(expsMini || []) as any[]} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
