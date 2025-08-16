// src/app/expedientes/page.tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabaseServer';
import ClientCreateExpediente from '@/components/ClientCreateExpediente';
import { createExpedienteAction } from './actions';

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

export default async function ExpedientesPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expedientes')
    .select('id,codigo,proyecto,cliente,inicio,fin,prioridad,estado,horas_previstas,horas_reales')
    .order('inicio', { ascending: false });

  if (error) {
    return <main className="container"><p className="error">Error al cargar expedientes: {error.message}</p></main>;
  }

  const exps = (data || []) as Expediente[];

  return (
    <main className="container">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h2>Expedientes</h2>
        <ClientCreateExpediente action={createExpedienteAction} />
      </div>

      <div className="table-wrap">
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
              <th style={{ textAlign: 'right' }}>Horas (prev/reales)</th>
            </tr>
          </thead>
          <tbody>
            {exps.map(e => (
              <tr key={e.id}>
                <td><Link href={`/expedientes/${encodeURIComponent(e.codigo)}`}>{e.codigo}</Link></td>
                <td>{e.proyecto}</td>
                <td>{e.cliente ?? '—'}</td>
                <td>{e.inicio ?? '—'}</td>
                <td>{e.fin ?? '—'}</td>
                <td>{e.prioridad ?? '—'}</td>
                <td>{e.estado ?? '—'}</td>
                <td style={{ textAlign: 'right' }}>
                  {(e.horas_previstas ?? 0).toFixed(1)} / {(e.horas_reales ?? 0).toFixed(1)}
                </td>
              </tr>
            ))}
            {exps.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', opacity: .7 }}>No hay expedientes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
