// src/app/expedientes/page.tsx
import { cookies } from 'next/headers';
import Link from 'next/link';
import FiltrosExpedientes from '@/components/FiltrosExpedientes';
import Modal from '@/components/Modal';
import { createClient } from '@/lib/supabaseServer';
import { revalidatePath } from 'next/cache';
import ClientCreateExpediente from '@/components/ClientCreateExpediente';

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

async function fetchExpedientes(params: {
  q?: string;
  estado?: string;
  prioridad?: string;
  orderBy?: 'inicio' | 'fin' | 'horas_reales';
}) {
  const supabase = createClient(cookies());
  let query = supabase.from('expedientes').select('*');

  if (params.q && params.q.trim()) {
    const q = params.q.trim();
    query = query.or(`codigo.ilike.%${q}%,proyecto.ilike.%${q}%,cliente.ilike.%${q}%`);
  }
  if (params.estado && params.estado !== 'todos') {
    query = query.eq('estado', params.estado);
  }
  if (params.prioridad && params.prioridad !== 'todas') {
    query = query.eq('prioridad', params.prioridad);
  }
  const order = params.orderBy || 'inicio';
  query = query.order(order, { ascending: true, nullsFirst: true });

  const { data, error } = await query;
  if (error) throw new Error(`Error al cargar expedientes: ${error.message}`);
  return (data ?? []) as Expediente[];
}

// Server Action: crear expediente
export async function createExpediente(formData: FormData) {
  'use server';
  const supabase = createClient(cookies());
  const payload = {
    codigo: String(formData.get('codigo') || '').trim(),
    proyecto: String(formData.get('proyecto') || '').trim(),
    cliente: String(formData.get('cliente') || '').trim(),
    inicio: String(formData.get('inicio') || '') || null,
    fin: String(formData.get('fin') || '') || null,
    prioridad: (String(formData.get('prioridad') || '') || null) as any,
    estado: (String(formData.get('estado') || '') || null) as any,
  };
  const { error } = await supabase.from('expedientes').insert(payload);
  if (error) throw new Error(`No se pudo crear el expediente: ${error.message}`);
  revalidatePath('/expedientes');
}

export default async function Page({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    estado?: string;
    prioridad?: string;
    orderBy?: 'inicio' | 'fin' | 'horas_reales';
  };
}) {
  const params = {
    q: searchParams?.q,
    estado: searchParams?.estado,
    prioridad: searchParams?.prioridad,
    orderBy: (searchParams?.orderBy as any) || 'inicio',
  };
  const expedientes = await fetchExpedientes(params);

  return (
    <main className="container">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h2>Expedientes</h2>
        {/* Botón + (emoji) mediante cliente */}
        <ClientCreateExpediente action={createExpediente} />
      </div>

      <FiltrosExpedientes />

      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 120 }}>Código</th>
                <th>Proyecto</th>
                <th>Cliente</th>
                <th style={{ width: 110 }}>Inicio</th>
                <th style={{ width: 110 }}>Fin</th>
                <th style={{ width: 120 }}>Prioridad</th>
                <th style={{ width: 150 }}>Estado</th>
                <th style={{ width: 120, textAlign: 'right' }}>Horas (R)</th>
                <th style={{ width: 80, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expedientes.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 16 }}>
                    No hay expedientes con los filtros actuales.
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
                    <td>{e.cliente}</td>
                    <td>{e.inicio ?? '—'}</td>
                    <td>{e.fin ?? '—'}</td>
                    <td>{e.prioridad ?? '—'}</td>
                    <td>{e.estado ?? '—'}</td>
                    <td style={{ textAlign: 'right' }}>{Number(e.horas_reales ?? 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {/* Por ahora sólo navegación a detalle; edición/borrado los haremos con modales en el detalle */}
                      <Link href={`/expedientes/${encodeURIComponent(e.codigo)}`} className="btn-icon" aria-label="Ver tareas">🔎</Link>
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
