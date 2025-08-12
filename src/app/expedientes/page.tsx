import { supabaseAdmin } from '../../lib/supabaseAdmin';
import NuevoExpediente from '../../components/NuevoExpediente';

function fmt(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(+dt)) return '—';
  return dt.toLocaleDateString('es-ES');
}

export default async function ExpedientesPage() {
  const sb = supabaseAdmin();

  // 1) Cargar expedientes
  const { data: expedientes, error } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto, cliente, fin, prioridad, estado')
    .order('fin', { ascending: true });

  if (error) {
    return (
      <main>
        <h2>Expedientes</h2>
        <p>Error al cargar: {error.message}</p>
      </main>
    );
  }

  // 2) Cargar partes (solo expediente_id y horas) y calcular totales en código
  const { data: partes } = await sb
    .from('partes')
    .select('expediente_id, horas')
    .not('expediente_id', 'is', null);

  const totalPorId = new Map<string, number>();
  (partes || []).forEach((p: any) => {
    const id = p.expediente_id as string;
    const h = typeof p.horas === 'number' ? p.horas : Number(p.horas || 0);
    totalPorId.set(id, (totalPorId.get(id) || 0) + (isNaN(h) ? 0 : h));
  });

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
     <NuevoExpediente />
    </main>
  );
}
