import { supabaseAdmin } from '../../lib/supabaseAdmin';

function fmt(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(+dt)) return '—';
  return dt.toLocaleDateString('es-ES');
}

export default async function ExpedientesPage() {
  const sb = supabaseAdmin();

  // 1) Expedientes
  const { data: expedientes, error } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto, cliente, fin, prioridad, estado')
    .order('fin', { ascending: true });
  if (error) return <main><h2>Expedientes</h2><p>Error: {error.message}</p></main>;

  // 2) Totales de horas por expediente (una consulta agrupada)
  const { data: tot } = await sb
    .from('partes')
    .select('expediente_id, total:sum(horas)')
    .not('expediente_id', 'is', null)
    .group('expediente_id');

  const totalPorId = new Map<string, number>();
  (tot || []).forEach((r: any) => { if (r.expediente_id) totalPorId.set(r.expediente_id, Number(r.total || 0)); });

  return (
    <main>
      <h2>Expedientes</h2>
      <p>Total: {expedientes?.length ?? 0}</p>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Proyecto</th>
            <th>Cliente</th>
            <th>Fin</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Horas imputadas</th>
          </tr>
        </thead>
        <tbody>
          {expedientes?.map((e: any) => (
            <tr key={e.id}>
              <td><a href={`/expedientes/${e.codigo}`}><strong>{e.codigo}</strong></a></td>
              <td>{e.proyecto}</td>
              <td>{e.cliente ?? '—'}</td>
              <td>{fmt(e.fin)}</td>
              <td>{e.prioridad ?? '—'}</td>
              <td>{e.estado ?? '—'}</td>
              <td>{(totalPorId.get(e.id) ?? 0).toFixed(2)} h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
