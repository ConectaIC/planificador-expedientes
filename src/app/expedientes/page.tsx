// src/app/expedientes/page.tsx
import { createClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import ExpedienteRowActions from '@/components/ExpedienteRowActions';
import FiltrosExpedientes from '@/components/FiltrosExpedientes';

type Expediente = {
  id: number;
  codigo: string;
  proyecto: string;
  cliente: string;
  inicio: string | null;
  fin: string | null;
  prioridad: 'Baja' | 'Media' | 'Alta' | null;
  estado: 'Pendiente' | 'En curso' | 'En supervisión' | 'Entregado' | 'Cerrado' | null;
  horas_previstas: number | null;
  horas_reales: number | null;
};

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const supabase = createClient();

  const q = (typeof searchParams.q === 'string' ? searchParams.q : '')?.trim();
  const estado = (typeof searchParams.estado === 'string' ? searchParams.estado : '')?.trim();
  const prioridad = (typeof searchParams.prioridad === 'string' ? searchParams.prioridad : '')?.trim();
  const ordenar = (typeof searchParams.ordenar === 'string' ? searchParams.ordenar : 'inicio')?.trim();

  let query = supabase.from('expedientes').select('*');

  if (q) {
    query = query.or(`codigo.ilike.%${q}%,proyecto.ilike.%${q}%,cliente.ilike.%${q}%`);
  }
  if (estado) {
    query = query.eq('estado', estado);
  }
  if (prioridad) {
    query = query.eq('prioridad', prioridad);
  }

  const orderMap: Record<string, { col: string; asc: boolean }> = {
    inicio: { col: 'inicio', asc: true },
    fin: { col: 'fin', asc: true },
    horas: { col: 'horas_reales', asc: false },
    prioridad: { col: 'prioridad', asc: true },
  };
  const { col, asc } = orderMap[ordenar] || orderMap.inicio;
  query = query.order(col, { ascending: asc, nullsFirst: true });

  const { data, error } = await query;
  if (error) {
    return (
      <div className="card">
        <h2 className="card-title">Expedientes</h2>
        <p style={{ color: 'crimson' }}>Error al cargar expedientes: {error.message}</p>
      </div>
    );
  }

  const expedientes = (data || []) as Expediente[];

  return (
    <>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-toolbar" style={{ justifyContent: 'space-between' }}>
          <h2 className="card-title">Expedientes</h2>
          <div>
            {/* Botón “solo emoji” para NUEVO */}
            <Link href="/expedientes?nuevo=1" className="icon-btn" aria-label="Nuevo expediente" title="Nuevo expediente">➕</Link>
          </div>
        </div>
        {/* Filtros automáticos (sin botón aplicar) */}
        <FiltrosExpedientes />
      </div>

      <div className="card">
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
              <th>Horas (Prev/Real)</th>
              <th style={{ textAlign: 'center', width: 90 }}>⋯</th>
            </tr>
          </thead>
          <tbody>
            {expedientes.map((e) => (
              <tr key={e.id}>
                <td><Link href={`/expedientes/${encodeURIComponent(e.codigo)}`}>{e.codigo}</Link></td>
                <td>{e.proyecto}</td>
                <td>{e.cliente}</td>
                <td>{e.inicio ?? '—'}</td>
                <td>{e.fin ?? '—'}</td>
                <td>
                  <span className={`badge ${e.prioridad === 'Alta' ? 'high' : e.prioridad === 'Media' ? 'medium' : 'low'}`}>
                    {e.prioridad ?? '—'}
                  </span>
                </td>
                <td>{e.estado ?? '—'}</td>
                <td>
                  {(e.horas_previstas ?? 0).toFixed(1)} / <strong>{(e.horas_reales ?? 0).toFixed(1)}</strong>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <ExpedienteRowActions expediente={e} />
                </td>
              </tr>
            ))}
            {expedientes.length === 0 && (
              <tr><td colSpan={9} style={{ color: '#64748b', textAlign: 'center', padding: 18 }}>No hay expedientes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
