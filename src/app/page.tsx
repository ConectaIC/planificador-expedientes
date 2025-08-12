import { supabaseAdmin } from '../../lib/supabaseAdmin';

function fmt(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(+dt)) return '—';
  return dt.toLocaleDateString('es-ES');
}

export default async function ExpedientesPage() {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('expedientes')
    .select('*')
    .order('fin', { ascending: true });

  if (error) {
    return (
      <main>
        <h2>Expedientes</h2>
        <p>Error al cargar: {error.message}</p>
      </main>
    );
  }

  return (
    <main>
      <h2>Expedientes</h2>
      <p>Total: {data?.length ?? 0}</p>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Proyecto</th>
            <th>Cliente</th>
            <th>Fin</th>
            <th>Prioridad</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((e: any) => (
            <tr key={e.id}>
              <td><strong>{e.codigo}</strong></td>
              <td>{e.proyecto}</td>
              <td>{e.cliente ?? '—'}</td>
              <td>{fmt(e.fin)}</td>
              <td>{e.prioridad ?? '—'}</td>
              <td>{e.estado ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
