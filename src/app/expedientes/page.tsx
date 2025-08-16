// src/app/expedientes/page.tsx
// Tipo: Server Component

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import FiltrosExepdientes from '../../components/FiltrosExepdientes';
import NewExpedienteModal from '../../components/NewExpedienteModal';
import ExpedienteRowActions from '../../components/ExpedienteRowActions';

type Expediente = {
  id: number;
  codigo: string;
  proyecto: string | null;
  cliente: string | null;
  inicio: string | null;
  fin: string | null;
  prioridad: string | null;   // Baja | Media | Alta
  estado: string | null;      // Pendiente | En curso | En supervisión | Entregado | Cerrado
  horas_previstas: number | null;
  horas_reales: number | null;
};

function fmt(n: any) {
  const v = Number(n);
  return Number.isFinite(v) ? v.toFixed(2) : '—';
}

// ───────────────────────────────────────────────────────────────────────────────
// Server Actions (mutaciones) — se pasan como props a los componentes cliente
// ───────────────────────────────────────────────────────────────────────────────
export async function createExpediente(formData: FormData) {
  'use server';
  const sb = supabaseAdmin();
  const payload = {
    codigo: String(formData.get('codigo') || '').trim(),
    proyecto: String(formData.get('proyecto') || '').trim() || null,
    cliente: String(formData.get('cliente') || '').trim() || null,
    inicio: String(formData.get('inicio') || '') || null,
    fin: String(formData.get('fin') || '') || null,
    prioridad: String(formData.get('prioridad') || '') || null,
    estado: String(formData.get('estado') || '') || null,
    horas_previstas: Number(formData.get('horas_previstas') || 0) || 0,
    horas_reales: Number(formData.get('horas_reales') || 0) || 0,
  };

  const { error } = await sb.from('expedientes').insert(payload);
  if (error) throw new Error(error.message);
}

export async function updateExpediente(formData: FormData) {
  'use server';
  const sb = supabaseAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('ID de expediente no válido');

  const payload = {
    codigo: String(formData.get('codigo') || '').trim(),
    proyecto: String(formData.get('proyecto') || '').trim() || null,
    cliente: String(formData.get('cliente') || '').trim() || null,
    inicio: String(formData.get('inicio') || '') || null,
    fin: String(formData.get('fin') || '') || null,
    prioridad: String(formData.get('prioridad') || '') || null,
    estado: String(formData.get('estado') || '') || null,
    horas_previstas: Number(formData.get('horas_previstas') || 0) || 0,
    horas_reales: Number(formData.get('horas_reales') || 0) || 0,
  };

  const { error } = await sb.from('expedientes').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteExpediente(formData: FormData) {
  'use server';
  const sb = supabaseAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('ID de expediente no válido');

  const { error } = await sb.from('expedientes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ───────────────────────────────────────────────────────────────────────────────

export default async function Page({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const q = (k: string, def = '') => {
    const v = searchParams?.[k];
    return (Array.isArray(v) ? v[0] : v) ?? def;
  };

  const texto = String(q('q')).trim();
  const estado = String(q('estado')).trim();
  const prioridad = String(q('prioridad')).trim();
  const ordenar = (String(q('orden')) || 'inicio_desc').trim();

  const sb = supabaseAdmin();

  let query = sb
    .from('expedientes')
    .select('id,codigo,proyecto,cliente,inicio,fin,prioridad,estado,horas_previstas,horas_reales');

  if (texto) {
    // búsqueda por código, proyecto o cliente
    query = query.or(
      `codigo.ilike.%${texto}%,proyecto.ilike.%${texto}%,cliente.ilike.%${texto}%`
    );
  }
  if (estado) query = query.eq('estado', estado);
  if (prioridad) query = query.eq('prioridad', prioridad);

  const [campo, dir] = (() => {
    switch (ordenar) {
      case 'inicio_asc':
        return ['inicio', { ascending: true as const }];
      case 'inicio_desc':
        return ['inicio', { ascending: false as const }];
      case 'horas_desc':
        return ['horas_reales', { ascending: false as const }];
      case 'horas_asc':
        return ['horas_reales', { ascending: true as const }];
      default:
        return ['inicio', { ascending: false as const }];
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

  const expedientes: Expediente[] = (data || []).map((e: any) => ({
    id: Number(e.id),
    codigo: String(e.codigo),
    proyecto: e.proyecto ?? null,
    cliente: e.cliente ?? null,
    inicio: e.inicio ?? null,
    fin: e.fin ?? null,
    prioridad: e.prioridad ?? null,
    estado: e.estado ?? null,
    horas_previstas: e.horas_previstas ?? null,
    horas_reales: e.horas_reales ?? null,
  }));

  return (
    <main className="container">
      <div
        className="card"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
      >
        <h1>Expedientes</h1>

        {/* Botón ➕ modal de alta (no navega) */}
        <NewExpedienteModal onCreate={createExpediente} />
      </div>

      <FiltrosExepdientes />

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
              <th>Horas (real / prev.)</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {expedientes.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center' }}>
                  No hay expedientes que cumplan el filtro.
                </td>
              </tr>
            ) : (
              expedientes.map((e) => (
                <tr key={e.id}>
                  <td>
                    <a className="btn-link" href={`/expedientes/${encodeURIComponent(e.codigo)}`}>
                      {e.codigo}
                    </a>
                  </td>
                  <td>{e.proyecto || '—'}</td>
                  <td>{e.cliente || '—'}</td>
                  <td>{e.inicio ? new Date(e.inicio).toLocaleDateString('es-ES') : '—'}</td>
                  <td>{e.fin ? new Date(e.fin).toLocaleDateString('es-ES') : '—'}</td>
                  <td>{e.prioridad || '—'}</td>
                  <td>{e.estado || '—'}</td>
                  <td>
                    <strong>{fmt(e.horas_reales)}</strong> / {fmt(e.horas_previstas)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <ExpedienteRowActions
                      expediente={e}
                      onUpdate={updateExpediente}
                      onDelete={deleteExpediente}
                    />
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
