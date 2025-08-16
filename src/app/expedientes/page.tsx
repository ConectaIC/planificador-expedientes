// src/app/expedientes/page.tsx
// Tipo: Server Component

'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import NewExpedienteModal, { ExpedienteInput } from '@/components/NewExpedienteModal';

type Prioridad = 'Baja' | 'Media' | 'Alta';
type EstadoExp = 'Pendiente' | 'En curso' | 'En supervisión' | 'Entregado' | 'Cerrado';

type Expediente = {
  id: number;
  codigo: string;
  proyecto: string;
  cliente: string;
  inicio: string | null;
  fin: string | null;
  prioridad: Prioridad | null;
  estado: EstadoExp | null;
  horas_previstas: number | null;
  horas_reales: number | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ExpedientesPage() {
  // datos
  const [rows, setRows] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filtros
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<'todos' | EstadoExp>('todos');
  const [prioridad, setPrioridad] = useState<'todas' | Prioridad>('todas');
  const [orden, setOrden] = useState<'fin_asc' | 'fin_desc' | 'codigo_asc' | 'codigo_desc' | 'horas_asc' | 'horas_desc'>('fin_asc');

  // modal crear
  const [openNew, setOpenNew] = useState(false);

  async function fetchData() {
    try {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from('expedientes')
        .select('id,codigo,proyecto,cliente,inicio,fin,prioridad,estado,horas_previstas,horas_reales')
        .order('fin', { ascending: true });
      if (error) throw error;
      setRows((data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? 'No se pudieron cargar los expedientes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filtrados = useMemo(() => {
    let list = rows.slice();
    const qnorm = q.trim().toLowerCase();
    if (qnorm) {
      list = list.filter(
        (r) =>
          r.codigo?.toLowerCase().includes(qnorm) ||
          r.proyecto?.toLowerCase().includes(qnorm) ||
          r.cliente?.toLowerCase().includes(qnorm)
      );
    }
    if (estado !== 'todos') list = list.filter((r) => r.estado === estado);
    if (prioridad !== 'todas') list = list.filter((r) => r.prioridad === prioridad);

    switch (orden) {
      case 'fin_desc':
        list.sort((a, b) => (b.fin || '').localeCompare(a.fin || ''));
        break;
      case 'codigo_asc':
        list.sort((a, b) => a.codigo.localeCompare(b.codigo));
        break;
      case 'codigo_desc':
        list.sort((a, b) => b.codigo.localeCompare(a.codigo));
        break;
      case 'horas_asc':
        list.sort(
          (a, b) => (a.horas_reales ?? 0) - (b.horas_reales ?? 0)
        );
        break;
      case 'horas_desc':
        list.sort(
          (a, b) => (b.horas_reales ?? 0) - (a.horas_reales ?? 0)
        );
        break;
      default: // fin_asc
        list.sort((a, b) => (a.fin || '').localeCompare(b.fin || ''));
    }
    return list;
  }, [rows, q, estado, prioridad, orden]);

  async function handleCreate(payload: ExpedienteInput) {
    const { error } = await supabase.from('expedientes').insert({
      codigo: payload.codigo,
      proyecto: payload.proyecto,
      cliente: payload.cliente,
      inicio: payload.inicio || null,
      fin: payload.fin || null,
      prioridad: payload.prioridad || null,
      estado: payload.estado || null,
    });
    if (error) throw error;
    await fetchData();
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Borrar expediente y sus relaciones?')) return;
    const { error } = await supabase.from('expedientes').delete().eq('id', id);
    if (error) alert(error.message);
    await fetchData();
  }

  return (
    <main className="container">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1>Expedientes</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" aria-label="Nuevo expediente" title="Nuevo expediente" onClick={() => setOpenNew(true)}>
            <span className="icon-emoji">➕</span>
          </button>
        </div>
      </div>

      <div className="filters">
        <input className="inp" placeholder="Buscar por código, proyecto o cliente" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="inp" value={estado} onChange={(e) => setEstado(e.target.value as any)}>
          <option value="todos">Estado: todos</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En curso">En curso</option>
          <option value="En supervisión">En supervisión</option>
          <option value="Entregado">Entregado</option>
          <option value="Cerrado">Cerrado</option>
        </select>
        <select className="inp" value={prioridad} onChange={(e) => setPrioridad(e.target.value as any)}>
          <option value="todas">Prioridad: todas</option>
          <option value="Baja">Baja</option>
          <option value="Media">Media</option>
          <option value="Alta">Alta</option>
        </select>
        <select className="inp" value={orden} onChange={(e) => setOrden(e.target.value as any)}>
          <option value="fin_asc">Orden: Fin ↑</option>
          <option value="fin_desc">Orden: Fin ↓</option>
          <option value="codigo_asc">Orden: Código ↑</option>
          <option value="codigo_desc">Orden: Código ↓</option>
          <option value="horas_asc">Orden: Horas ↑</option>
          <option value="horas_desc">Orden: Horas ↓</option>
        </select>
      </div>

      {err && <div className="alert error">Error al cargar expedientes: {err}</div>}
      {loading ? (
        <div className="muted">Cargando…</div>
      ) : (
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
                <th>Horas (reales)</th>
                <th style={{ width: 90, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((e) => (
                <tr key={e.id}>
                  <td>
                    <a className="link" href={`/expedientes/${encodeURIComponent(e.codigo)}`}>{e.codigo}</a>
                  </td>
                  <td>{e.proyecto}</td>
                  <td>{e.cliente}</td>
                  <td>{e.inicio ?? '—'}</td>
                  <td>{e.fin ?? '—'}</td>
                  <td>{e.prioridad ?? '—'}</td>
                  <td>{e.estado ?? '—'}</td>
                  <td>{(e.horas_reales ?? 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <a className="icon-btn" aria-label="Editar" title="Editar" href={`/expedientes/${encodeURIComponent(e.codigo)}`}>
                      <span className="icon-emoji">✏️</span>
                    </a>
                    <button className="icon-btn" aria-label="Borrar" title="Borrar" onClick={() => handleDelete(e.id)}>
                      <span className="icon-emoji">🗑️</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr><td colSpan={9} className="muted">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <NewExpedienteModal
        open={openNew}
        onClose={() => setOpenNew(false)}
        onCreate={handleCreate}
      />
    </main>
  );
}
