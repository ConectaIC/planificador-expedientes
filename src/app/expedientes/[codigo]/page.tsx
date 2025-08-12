import { supabaseAdmin } from '../../../lib/supabaseAdmin';

function fmt(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(+dt) ? '—' : dt.toLocaleDateString('es-ES');
}

export default async function ExpDetalle({ params }: { params: { codigo: string } }) {
  const sb = supabaseAdmin();

  // 1) Cargar el expediente por código
  const { data: exp, error: eExp } = await sb
    .from('expedientes')
    .select('*')
    .eq('codigo', params.codigo)
    .maybeSingle();

  if (eExp) {
    return <main><h2>Expediente</h2><p>Error: {eExp.message}</p></main>;
  }
  if (!exp) {
    return <main><h2>Expediente</h2><p>No encontrado: {params.codigo}</p></main>;
  }

  // 2) Cargar tareas del expediente (ordenadas por vencimiento)
  const { data: tareas, error: eTar } = await sb
    .from('tareas')
    .select('id, titulo, estado, prioridad, horas_previstas, horas_realizadas, vencimiento')
    .eq('expediente_id', exp.id)
    .order('vencimiento', { ascending: true });

  if (eTar) {
    return <main><h2>{exp.codigo} — {exp.proyecto}</h2><p>Error cargando tareas: {eTar.message}</p></main>;
  }

  return (
    <main>
      <h2>{exp.codigo} — {exp.proyecto}</h2>
      <p>
        Cliente: {exp.cliente ?? '—'} · Fin: {fmt(exp.fin)} ·
        Prioridad: {exp.prioridad ?? '—'} · Estado: {exp.estado ?? '—'}
      </p>

      <h3>Tareas pendientes</h3>
      <table>
        <thead>
          <tr>
            <th>Título</th>
            <th>Estado</th>
            <th>Prioridad</th>
            <th>Previstas (h)</th>
            <th>Realizadas (h)</th>
            <th>Vencimiento</th>
          </tr>
        </thead>
        <tbody>
          {tareas?.length ? tareas.map((t:any)=>(
            <tr key={t.id}>
              <td>{t.titulo}</td>
              <td>{t.estado ?? 'Pendiente'}</td>
              <td>{t.prioridad ?? '—'}</td>
              <td>{t.horas_previstas ?? '—'}</td>
              <td>{t.horas_realizadas ?? '—'}</td>
              <td>{fmt(t.vencimiento)}</td>
            </tr>
          )) : (
            <tr><td colSpan={6}>Sin tareas aún.</td></tr>
          )}
        </tbody>
      </table>

      <p style={{marginTop:16}}>
        <a href="/expedientes">← Volver a expedientes</a>
      </p>
    </main>
  );
}
