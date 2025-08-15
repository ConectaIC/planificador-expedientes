// src/app/expedientes/page.tsx
// Tipo: Server Component

import Link from 'next/link';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import FiltrosExpedientes from '../../components/FiltrosExpedientes';
import NuevoExpediente from '../../components/NuevoExpediente';
import ExpedienteRowActions from '../../components/ExpedienteRowActions'; // nuevo wrapper cliente

type Expediente = {
  id: number;
  codigo: string;
  proyecto: string | null;
  cliente: string | null;
  inicio: string | null;
  fin: string | null;
  prioridad: string | null;
  estado: string | null;
  horas_previstas: number | null;
  horas_reales: number | null;
};

function fmt(n: any) {
  const v = Number(n);
  return Number.isFinite(v) ? v.toFixed(2) : '—';
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const q = (k: string) => {
    const v = searchParams?.[k];
    return Array.isArray(v) ? v[0] : v || '';
  };

  const texto = q('q')?.trim() || '';
  const estado = q('estado')?.trim() || '';
  const prioridad = q('prioridad')?.trim() || '';
  const ordenar = q('orden')?.trim() || 'codigo_asc';

  const sb = supabaseAdmin();

  let query = sb
    .from('expedientes')
    .select('id,codigo,proyecto,cliente,inicio,fin,prioridad,estado,horas_previstas,horas_reales');

  if (texto) {
    query = query.or(
      `codigo.ilike.%${texto}%,proyecto.ilike.%${texto}%,cliente.ilike.%${texto}%`
    );
  }
  if (estado) query = query.eq('estado', estado);
  if (prioridad) query = query.eq('prioridad', prioridad);

  const [campo, dir] = (() => {
    switch (ordenar) {
      case 'fin_asc':
        return ['fin', { ascending: true as const }];
      case 'fin_desc':
        return ['fin', { ascending: false as const }];
      case 'horas_desc':
        return ['horas_reales', { ascending: false as const }];
      case 'horas_asc':
        return ['horas_reales', { ascending: true as const }];
      case 'codigo_desc':
        return ['codigo', { ascending: false as const }];
      case 'codigo_asc':
      default:
        return ['codigo', { ascending: true as const }];
    }
  })();

  const { data, error } = await query.order(campo, dir);
  if (error) {
    return (
      <main className="container">
        <h1>Expedientes</h1>
        <div className="error">Error al cargar expedientes: {error.message}</div>
      </main>
    );
  }

  const expedientes = (data || []) as Expediente[];

  return (
    <main className="container">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1>Expedientes</h1>
        {/* Botón de alta con modal existente */}
        <NuevoExpediente />
      </div>

      <FiltrosExpedientes />

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Proyecto</th>
              <th>Cliente</th>
              <th>Fin</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Horas (real / prev.)</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {expedientes.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center' }}>No hay expedientes que cumplan el filtro.</td>
              </tr>
            ) : (
              expedientes.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link className="btn-link" href={`/expedientes/${encodeURIComponent(e.codigo)}`}>
                      {e.codigo}
                    </Link>
                  </td>
                  <td>{e.proyecto || '—'}</td>
                  <td>{e.cliente || '—'}</td>
                  <td>{e.fin ? new Date(e.fin).toLocaleDateString('es-ES') : '—'}</td>
                  <td>{e.prioridad || '—'}</td>
                  <td>{e.estado || '—'}</td>
                  <td>
                    <strong>{fmt(e.horas_reales)}</strong> / {fmt(e.horas_previstas)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {/* Acciones de fila (cliente) reutilizando modales existentes */}
                    <ExpedienteRowActions expediente={e} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
