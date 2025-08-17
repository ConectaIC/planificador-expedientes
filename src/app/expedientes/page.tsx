// src/app/expedientes/page.tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabaseServer';
import NewExpedienteButton from '@/components/NewExpedienteButton';
import ExpedienteRowActions from '@/components/ExpedienteRowActions';

type Expediente = {
  id: number;
  codigo: string;
  proyecto: string | null;
  horas_previstas: number | null;
  horas_realizadas: number | null;
  estado: string | null;
  prioridad: string | null;
  vencimiento: string | null; // YYYY-MM-DD
};

async function fetchExpedientes(): Promise<Expediente[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expedientes')
    .select(
      'id, codigo, proyecto, horas_previstas, horas_realizadas, estado, prioridad, vencimiento'
    )
    .order('codigo', { ascending: true })
    .returns<Expediente[]>(); // <<< clave: tipamos la salida

  if (error) {
    console.error('Error cargando expedientes:', error.message);
    return [];
  }
  return data ?? [];
}

export default async function Page() {
  const expedientes = await fetchExpedientes();

  return (
    <main className="container">
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Expedientes</h1>
        <NewExpedienteButton />
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Código</th>
                <th>Proyecto</th>
                <th style={{ width: 130, textAlign: 'right' }}>Horas prev.</th>
                <th style={{ width: 130, textAlign: 'right' }}>Horas real.</th>
                <th style={{ width: 120 }}>Estado</th>
                <th style={{ width: 120 }}>Prioridad</th>
                <th style={{ width: 140 }}>Vencimiento</th>
                <th style={{ width: 110, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expedientes.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 24 }}>
                    No hay expedientes.
                  </td>
                </tr>
              ) : (
                expedientes.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link
                        href={`/expedientes/${encodeURIComponent(e.codigo)}`}
                        className="link"
                      >
                        {e.codigo}
                      </Link>
                    </td>
                    <td>{e.proyecto ?? ''}</td>
                    <td style={{ textAlign: 'right' }}>
                      {e.horas_previstas != null ? e.horas_previstas.toFixed(2) : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {e.horas_realizadas != null ? e.horas_realizadas.toFixed(2) : '-'}
                    </td>
                    <td>{e.estado ?? ''}</td>
                    <td>{e.prioridad ?? ''}</td>
                    <td>{e.vencimiento ?? ''}</td>
                    <td style={{ textAlign: 'center' }}>
                      <ExpedienteRowActions expediente={e} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
