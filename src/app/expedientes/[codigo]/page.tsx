export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import TareasTabla from '../../../components/TareasTabla';
import NuevaTarea from '../../../components/NuevaTarea';

function fmt(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(+dt) ? '—' : dt.toLocaleDateString('es-ES');
}

export default async function ExpDetalle({ params }: { params: { codigo: string } }) {
  const sb = supabaseAdmin();

  // 1) Expediente por código
  const { data: exp, error: eExp } = await sb
    .from('expedientes')
    .select('*')
    .eq('codigo', params.codigo)
    .maybeSingle();

  if (eExp) {
    return (
      <main>
        <h2>Expediente</h2>
        <p>Error: {eExp.message}</p>
        <p><a href="/expedientes">← Volver a expedientes</a></p>
      </main>
    );
  }
  if (!exp) {
    return (
      <main>
        <h2>Expediente</h2>
        <p>No encontrado: {params.codigo}</p>
        <p><a href="/expedientes">← Volver a expedientes</a></p>
      </main>
    );
  }

  // 2) Tareas del expediente
  const { data: tareas, error: eTar } = await sb
    .from('tareas')
    .select('id, titulo, estado, prioridad, horas_previstas, horas_realizadas, vencimiento')
    .eq('expediente_id', exp.id)
    .order('vencimiento', { ascending: true });

  if (eTar) {
    return (
      <main>
        <h2>{exp.codigo} — {exp.proyecto}</h2>
        <p>Error cargando tareas: {eTar.message}</p>
        <p><a href="/expedientes">← Volver a expedientes</a></p>
      </main>
    );
  }

  return (
    <main>
      <h2>{exp.codigo} — {exp.proyecto}</h2>
      <p>
        Cliente: {exp.cliente ?? '—'} · Fin: {fmt(exp.fin)} ·
        Prioridad: {exp.prioridad ?? '—'} · Estado: {exp.estado ?? '—'}
      </p>

      <h3>Tareas pendientes</h3>
      <TareasTabla tareasIniciales={tareas || []} />

      <NuevaTarea codigo={exp.codigo} />

      <p style={{ marginTop: 16 }}>
        <a href="/expedientes">← Volver a expedientes</a>
      </p>
    </main>
  );
}

