// src/app/expedientes/page.tsx
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabaseServer';
import ClientCreateExpediente from '@/components/ClientCreateExpediente';
import { createExpedienteAction } from '@/app/expedientes/actions';

type Expediente = {
  id: number;
  codigo: string;
  proyecto: string;
  cliente: string | null;
  inicio: string | null;
  fin: string | null;
  prioridad: 'Baja' | 'Media' | 'Alta' | null;
  estado: 'Pendiente' | 'En curso' | 'En supervisión' | 'Entregado' | 'Cerrado' | null;
  horas_previstas: number | null;
  horas_reales: number | null;
};

async function fetchExpedientes() {
  const supabase = createClient(cookies());

  const { data, error } = await supabase
    .from('expedientes')
    .select('*')
    .order('inicio', { ascending: false, nullsFirst: true });

  if (error) throw new Error(`Error al cargar expedientes: ${error.message}`);
  return (data ?? []) as Expediente[];
}

export default async function Page() {
  const expedientes = await fetchExpedientes();

  return (
    <main className="container">
      <div
        className="card"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}
      >
        <h2>Expedientes</h2>

        {/* Botón ➕ que abre modal (componente cliente) y llama a la server action */}
        <ClientCreateExpediente action={createExpedienteAction} />
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Proyecto</th>
                <th>Cliente</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Horas prev.</th>
                <th style={{ textAlign: 'right' }}>Horas reales</th>
              </tr>
            </thead>
            <tbody>
              {expedientes.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 16 }}>
                    No hay expedientes.
                  </td>
                </tr>
              ) : (
                expedientes.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link href={`/expedientes/${encodeURIComponent(e.codigo)}`} className="btn-link">
                        {e.codigo}
                      </Link>
                    </td>
                    <td>{e.proyecto}</td>
                    <td>{e.cliente ?? '—'}</td>
                    <td>{e.inicio ?? '—'}</td>
                    <td>{e.fin ?? '—'}</td>
                    <td>{e.prioridad ?? '—'}</td>
                    <td>{e.estado ?? '—'}</td>
                    <td style={{ textAlign: 'right' }}>{Number(e.horas_previstas ?? 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{Number(e.horas_reales ?? 0).toFixed(2)}</td>
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
