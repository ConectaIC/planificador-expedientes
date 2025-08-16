// src/app/tareas/page.tsx
// Tipo: Server Component

'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import EditTareaModal, { TareaEditInput, MiniExpediente as MiniExp } from '@/components/EditTareaModal';

type Prioridad = 'Baja' | 'Media' | 'Alta';
type Estado = 'Pendiente' | 'En curso' | 'Completada';

type Tarea = {
  id: number;
  titulo: string;
  expediente_id: number | null;
  vencimiento: string | null;
  horas_previstas: number | null;
  horas_realizadas: number | null;
  estado: Estado | null;
  prioridad: Prioridad | null;
  descripcion: string | null;
  expedientes: { codigo: string } | null; // via foreign select one-to-one
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TareasPage() {
  const [rows, setRows] = useState<Tarea[]>([]);
  const [exps, setExps] = useState<MiniExp[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<'todos' | Estado>('todos');
  const [prioridad, setPrioridad] = useState<'todas' | Prioridad>('todas');
  const [orden, setOrden] = useState<'venc_asc' | 'venc_desc' | 'codigo_asc' | 'codigo_desc' | 'horas_asc' | 'horas_desc'>('venc_asc');

  const [edit, setEdit] = useState<TareaEditInput | null>(null);

  async function fetchData() {
    try {
      setLoading(true);
      setErr(null);

      const { data: tareas, error } = await supabase
        .from('tareas')
        .select('id,titulo,expediente_id,vencimiento,horas_previstas,horas_realizadas,estado,prioridad,descripcion,expedientes(codigo)')
        .order('vencimiento', { ascending: true });
      if (error) throw error;

      const { data: expsData, error: e2 } = await supabase
        .from('expedientes')
        .select('id,codigo')
        .order('codigo', { ascending: true });
      if (e2) throw e2;

      setRows((tareas as any) ?? []);
      setExps(((expsData as any) ?? []).map((x: any) => ({ id: x.id, codigo: x.codigo })));
    } catch (e: any) {
      setErr(e?.message ?? 'No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const filtradas = useMemo(() => {
    let list = rows.slice();
    const qnorm = q.trim().toLowerCase();
    if (qnorm) {
      list = list.filter(
        (r) =>
          r.titulo?.toLowerCase().includes(qnorm) ||
          r.expedientes?.codigo?.toLowerCase().includes(qnorm)
      );
    }
    if (estado !== 'todos') list = list.filter((r) => r.estado === estado);
    if (prioridad !== 'todas') list = list.filter((r) => r.prioridad === prioridad);

    switch (orden) {
      case 'venc_desc':
        list.sort((a, b) => (b.vencimiento || '').localeCompare(a.vencimiento || ''));
        break;
      case 'codigo_asc':
        list.sort((a, b) => (a.expedientes?.codigo || '').localeCompare(b.expedientes?.codigo || ''));
        break;
      case 'codigo_desc':
        list.sort((a, b) => (b.expedientes?.codigo || '').localeCompare(a.expedientes?.codigo || ''));
        break;
      case 'horas_asc':
        list.sort((a, b) => (a.horas_realizadas ?? 0) - (b.horas_realizadas ?? 0));
        break;
      case 'horas_desc':
        list.sort((a, b) => (b.horas_realizadas ?? 0) - (a.horas_realizadas ?? 0));
        break;
      default:
        list.sort((a, b) => (a.vencimiento || '').localeCompare(b.vencimiento || ''));
    }
    return list;
  }, [rows, q, estado, prioridad, orden]);

  async function handleSave(payload: TareaEditInput) {
    const { error } = await supabase.from('tareas').update({
      titulo: payload.titulo,
      expediente_id: payload.expediente_id,
      vencimiento: payload.vencimiento || null,
      horas_previstas: payload.horas_previstas ?? null,
      estado: payload.estado ?? null,
      prioridad: payload.prioridad ?? null,
      descripcion: payload.descripcion ?? null,
    }).eq('id', payload.id);
    if (error) throw error;
    await fetchData();
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Borrar tarea?')) return;
    const { error } = await supabase.from('tareas').delete().eq('id', id);
    if (error) alert(error.message);
    await fetchData();
  }

  return (
    <main className="container">
      <h1>Tareas</h1>

      <div className="filters">
        <input className="inp" placeholder="Buscar por proyecto, expediente, cliente o título" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="inp" value={estado} onChange={(e) => setEstado(e.target.value as any)}>
          <option value="todos">Estado: todos</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En curso">En curso</option>
          <option value="Completada">Completada</option>
        </select>
        <select className="inp" value={prioridad} onChange={(e) => setPrioridad(e.target.value as any)}>
          <option value="todas">Prioridad: todas</option>
          <option value="Baja">Baja</option>
          <option value="Media">Media</option>
          <option value="Alta">Alta</option>
        </select>
        <select className="inp" value={orden} onChange={(e) => setOrden(e.target.value as any)}>
          <option value="venc_asc">Orden: Vencimiento ↑</option>
          <option value="venc_desc">Orden: Vencimiento ↓</option>
          <option value="codigo_asc">Orden: Código ↑</option>
          <option value="codigo_desc">Orden: Código ↓</option>
          <option value="horas_asc">Orden: Horas ↑</option>
          <option value="horas_desc">Orden: Horas ↓</option>
        </select>
      </div>

      {err && <div className="alert error">Error al cargar tareas: {err}</div>}
      {loading ? (
        <div className="muted">Cargando…</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Expediente</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Vencimiento</th>
                <th>Horas (real / prev.)</th>
                <th style={{ width: 90, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((t) => (
                <tr key={t.id}>
                  <td>{t.titulo}</td>
                  <td>
                    {t.expedientes?.codigo ? (
                      <a className="link" href={`/expedientes/${encodeURIComponent(t.expedientes.codigo)}`}>{t.expedientes.codigo}</a>
                    ) : '—'}
                  </td>
                  <td>{t.estado ?? '—'}</td>
                  <td>{t.prioridad ?? '—'}</td>
                  <td>{t.vencimiento ?? '—'}</td>
                  <td>{(t.horas_realizadas ?? 0).toFixed(2)} / {(t.horas_previstas ?? 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="icon-btn"
                      aria-label="Editar"
                      title="Editar"
                      onClick={() =>
                        setEdit({
                          id: t.id,
                          titulo: t.titulo,
                          expediente_id: t.expediente_id,
                          vencimiento: t.vencimiento,
                          horas_previstas: t.horas_previstas,
                          estado: (t.estado as any) ?? 'Pendiente',
                          prioridad: (t.prioridad as any) ?? 'Media',
                          descripcion: t.descripcion,
                        })
                      }
                    >
                      <span className="icon-emoji">✏️</span>
                    </button>
                    <button className="icon-btn" aria-label="Borrar" title="Borrar" onClick={() => handleDelete(t.id)}>
                      <span className="icon-emoji">🗑️</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr><td colSpan={7} className="muted">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <EditTareaModal
        open={!!edit}
        onClose={() => setEdit(null)}
        tarea={edit}
        expedientes={exps}
        onSave={handleSave}
      />
    </main>
  );
}
