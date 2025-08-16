import Link from 'next/link';
import { createClient } from '@/lib/supabaseServer';
import NewExpedienteButton from '@/components/NewExpedienteButton';
import ExpedienteRowActions, { Expediente } from '@/components/ExpedienteRowActions';
import { revalidatePath } from 'next/cache';

async function fetchExpedientes(): Promise<Expediente[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expedientes')
    .select('id,codigo,proyecto,cliente,prioridad,estado,fin')
    .order('fin', { ascending: true, nullsFirst: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as any;
}

export default async function Page() {
  const expedientes = await fetchExpedientes();

  // callbacks opcionales para refrescar tras crear/editar/borrar
  const onMutate = async () => {
    'use server';
    revalidatePath('/expedientes');
  };

  return (
    <main className="container">
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Expedientes</h1>
        {/* Botón ➕ */}
        <NewExpedienteButton onCreated={onMutate} />
      </div>

      <div className="table-card">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Proyecto</th>
              <th>Cliente</th>
              <th>Fin</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th style={{ width: 100, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {expedientes.map((e) => (
              <tr key={e.id}>
                <td>
                  <Link href={`/expedientes/${encodeURIComponent(e.codigo)}`} className="link">
                    {e.codigo}
                  </Link>
                </td>
                <td>{e.proyecto ?? '—'}</td>
                <td>{e.cliente ?? '—'}</td>
                <td>{e.fin ?? '—'}</td>
                <td>{e.prioridad ?? '—'}</td>
                <td>{e.estado ?? '—'}</td>
                <td>
                  <ExpedienteRowActions expediente={e} onUpdate={onMutate} onDelete={onMutate} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
