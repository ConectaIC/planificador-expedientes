// src/app/partes/page.tsx
// Tipo: Server Component

'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import NewParteModal, { MiniExpediente as MiniExp, MiniTarea, ParteInput } from '@/components/NewParteModal';

type ParteRow = {
  id: number;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  horas: number | null;
  comentario: string | null;
  expediente_id: number | null;
  tarea_id: number | null;
  expedientes: { id: number; codigo: string } | null;
  tareas: { id: number; titulo: string } | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PartesPage() {
  const [rows, setRows] = useState<ParteRow[]>([]);
  const [exps, setExps] = useState<MiniExp[]>([]);
  const [tareas, setTareas] = useState<MiniTarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [orden, setOrden] = useState<'fecha_asc' | 'fecha_desc' | 'codigo_asc' | 'codigo_desc' | 'horas_asc' | 'horas_desc'>('fecha_desc');

  const [openNew, setOpenNew] = useState(false);

  async function fetchData() {
    try {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase
        .from('partes')
        .select('id,fecha,hora_inicio,hora_fin,horas,comentario,expediente_id,tarea_id,expedientes(id,codigo),tareas(id,titulo)')
        .order('fecha', { ascending: false });
      if (error) throw error;

      const { data: expsData, error: e2 } = await supabase
        .from('expedientes')
        .select('id,codigo')
        .order('codigo', { ascending: true });
      if (e2) throw e2;

      const { data: tareasData, error: e3 } = await supabase
        .from('tareas')
        .select('id,titulo,expediente_id')
        .order('titulo', { ascending: true });
      if (e3) throw e3;

      setRows((data as any) ?? []);
      setExps(((expsData as any) ?? []).map((x: any) => ({ id: x.id, codigo: x.codigo })));
      setTareas(((tareasData as any) ?? []).map((t: any) => ({ id: t.id, titulo: t.titulo, expediente_id: t.expediente_id })));
    } catch (e: any) {
      setErr(e?.message ?? 'No se pudieron cargar los partes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const filtrados = useMemo(() => {
    let list = rows.slice();
    const qnorm = q.trim().toLowerCase();
    if (qnorm) {
      list = list.filter(
        (r) =>
          r.expedientes?.codigo?.toLowerCase().includes(qnorm) ||
          r.tareas?.titulo?.toLowerCase().includes(qnorm) ||
          r.comentario?.toLowerCase().includes(qnorm)
      );
    }
    switch (orden) {
      case 'fecha_asc':
        list.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
        break;
      case 'codigo_asc':
        list.sort((a, b) => (a.expedientes?.codigo || '').localeCompare(b.expedientes?.codigo || ''));
        break;
      case 'codigo_desc':
        list.sort((a, b) => (b.expedientes?.codigo || '').localeCompare(a.expedientes?.codigo || ''));
        break;
      case 'horas_asc':
        list.sort((a, b) => (a.horas ?? 0) - (b.horas ?? 0));
        break;
      case 'horas_desc':
        list.sort((a, b) => (b.horas ?? 0) - (a.horas ?? 0));
        break;
      default: // fecha_desc
        list.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    }
    return list;
  }, [rows, q, orden]);

  async function handleCreate(payload: ParteInput) {
    const { error } = await supabase.from('partes').insert({
      fecha: payload.fecha,
      hora_inicio: payload.hora_inicio,
      hora_fin: payload.hora_fin,
      horas: payload.horas ?? null,
      comentario: payload.comentario || null,
      expediente_id: payload.expediente_id,
      tarea_id: payload.tarea_id,
    });
    if (error) throw error;
    await fetchData();
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Borrar parte?')) return;
    const { error } = await supabase.from('partes').delete().eq('id', id);
    if (error) alert(error.message);
    await fetchData();
  }

  return (
    <main className="container">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1>Partes</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" aria-label="Nuevo parte" title="Nuevo parte" onClick={() => setOpenNew(true)}>
            <span className="icon-emoji">➕</span>
          </button>
        </div>
      </div>

      <div className="filters">
        <input className="inp" placeholder="Buscar por expediente, tarea o comentario" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="inp" value={orden} onChange={(e) => setOrden(e.target.value as any)}>
          <option value="fecha_desc">Orden: Fecha ↓</option>
          <option value="fecha_asc">Orden: Fecha ↑</option>
          <option value="codigo_asc">Orden: Código ↑</option>
          <option value="codigo_desc">Orden: Código ↓</option>
          <option value="horas_asc">Orden: Horas ↑</option>
          <option value="horas_desc">Orden: Horas ↓</option>
        </select>
      </div>

      {err && <div className="alert error">Error al cargar partes: {err}</div>}
      {loading ? (
        <div className="muted">Cargando…</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Expediente</th>
                <th>Tarea</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Horas</th>
                <th>Comentario</th>
                <th style={{ width: 90, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id}>
                  <td>{p.fecha}</td>
                  <td>
                    {p.expedientes?.codigo ? (
                      <a className="link" href={`/expedientes/${encodeURIComponent(p.expedientes.codigo)}`}>{p.expedientes.codigo}</a>
                    ) : '—'}
                  </td>
                  <td>{p.tareas?.titulo ?? '—'}</td>
                  <td>{p.hora_inicio ?? '—'}</td>
                  <td>{p.hora_fin ?? '—'}</td>
                  <td>{(p.horas ?? 0).toFixed(2)}</td>
                  <td>{p.comentario ?? '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {/* Edición de parte podría venir después como EditParteModal */}
                    <button className="icon-btn" aria-label="Borrar" title="Borrar" onClick={() => handleDelete(p.id)}>
                      <span className="icon-emoji">🗑️</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr><td colSpan={8} className="muted">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <NewParteModal
        open={openNew}
        onClose={() => setOpenNew(false)}
        expedientes={exps}
        tareas={tareas}
        onCreate={handleCreate}
      />
    </main>
  );
}
