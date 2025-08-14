'use client';

import { useMemo, useState } from 'react';

export type Tarea = {
  id: string;
  titulo?: string | null;
  estado?: string | null;       // 'Pendiente' | 'En curso' | 'Completada'
  prioridad?: string | null;    // 'Alta' | 'Media' | 'Baja' | null
  horas_previstas?: number | null;
  horas_realizadas?: number | null;
  vencimiento?: string | null;  // <-- ahora opcional
  expediente_id?: string | null;
  expediente?: { codigo?: string | null; proyecto?: string | null } | null;
};

function fmtDate(d?: string | null) {
  if (!d) return '—';
  const s = d.includes('T') ? d.split('T')[0] : d;
  const [y, m, dd] = s.split('-');
  return `${dd}/${m}/${y}`;
}

function prioridadRank(p?: string | null) {
  const v = (p ?? '').toLowerCase();
  if (v === 'alta') return 1;
  if (v === 'media') return 2;
  if (v === 'baja') return 3;
  return 4;
}

export default function TareasTabla({
  tareas,
  expedienteId,
  onEdit,
  onDelete,
  onToggleCompletada
}: {
  tareas: Tarea[];
  expedienteId?: string;
  onEdit?: (t: Tarea) => void;
  onDelete?: (t: Tarea) => void;
  onToggleCompletada?: (t: Tarea, value: boolean) => void;
}) {
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado]   = useState<'todos'|'Pendiente'|'En curso'|'Completada'>('todos');
  const [filtroPrior, setFiltroPrior]     = useState<'todas'|'Alta'|'Media'|'Baja'|'Sin prioridad'>('todas');
  const [orden, setOrden] = useState<'vencAsc'|'vencDesc'|'prioAsc'|'prioDesc'>('vencAsc');

  const lista = useMemo(() => {
    let out = [...(tareas ?? [])];

    if (expedienteId) {
      out = out.filter(t => (t.expediente_id ?? '') === expedienteId);
    }

    const q = filtroTexto.trim().toLowerCase();
    if (q) {
      out = out.filter(t => {
        const cand = `${t.titulo ?? ''} ${t.expediente?.codigo ?? ''} ${t.expediente?.proyecto ?? ''}`.toLowerCase();
        return cand.includes(q);
      });
    }

    if (filtroEstado !== 'todos') {
      out = out.filter(t => (t.estado ?? '') === filtroEstado);
    }

    if (filtroPrior !== 'todas') {
      if (filtroPrior === 'Sin prioridad') {
        out = out.filter(t => !t.prioridad);
      } else {
        out = out.filter(t => (t.prioridad ?? '') === filtroPrior);
      }
    }

    out.sort((a, b) => {
      if (orden === 'vencAsc') {
        const va = a.vencimiento ?? '9999-12-31';
        const vb = b.vencimiento ?? '9999-12-31';
        return va.localeCompare(vb);
      }
      if (orden === 'vencDesc') {
        const va = a.vencimiento ?? '0000-01-01';
        const vb = b.vencimiento ?? '0000-01-01';
        return vb.localeCompare(va);
      }
      if (orden === 'prioAsc') {
        return prioridadRank(a.prioridad) - prioridadRank(b.prioridad);
      }
      // 'prioDesc'
      return prioridadRank(b.prioridad) - prioridadRank(a.prioridad);
    });

    return out;
  }, [tareas, expedienteId, filtroTexto, filtroEstado, filtroPrior, orden]);

  return (
    <div>
      <div className="toolbar">
        <input
          className="input"
          placeholder="Buscar por título o expediente…"
          value={filtroTexto}
          onChange={e => setFiltroTexto(e.target.value)}
        />
        <select className="select" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value as any)}>
          <option value="todos">Estado: todos</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En curso">En curso</option>
          <option value="Completada">Completada</option>
        </select>
        <select className="select" value={filtroPrior} onChange={e => setFiltroPrior(e.target.value as any)}>
          <option value="todas">Prioridad: todas</option>
          <option value="Alta">Alta</option>
          <option value="Media">Media</option>
          <option value="Baja">Baja</option>
          <option value="Sin prioridad">Sin prioridad</option>
        </select>
        <select className="select" value={orden} onChange={e => setOrden(e.target.value as any)}>
          <option value="vencAsc">Orden: Vencimiento ↑</option>
          <option value="vencDesc">Orden: Vencimiento ↓</option>
          <option value="prioAsc">Orden: Prioridad ↑</option>
          <option value="prioDesc">Orden: Prioridad ↓</option>
        </select>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th></th>
            <th>Título</th>
            <th>Expediente</th>
            <th>Prioridad</th>
            <th>Venc.</th>
            <th>Previstas</th>
            <th>Realizadas</th>
            <th>%</th>
            <th style={{width:110}}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {lista.map(t => {
            const prev = t.horas_previstas ?? 0;
            const real = t.horas_realizadas ?? 0;
            const pct = prev > 0 ? Math.round((real / prev) * 100) : 0;
            const completada = (t.estado ?? '').toLowerCase() === 'completada';

            return (
              <tr key={t.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={completada}
                    onChange={e => onToggleCompletada?.(t, e.target.checked)}
                    title="Marcar como completada"
                  />
                </td>
                <td>{t.titulo ?? '—'}</td>
                <td>{t.expediente?.codigo ? `${t.expediente?.codigo} — ${t.expediente?.proyecto ?? ''}` : '—'}</td>
                <td>{t.prioridad ?? '—'}</td>
                <td>{fmtDate(t.vencimiento)}</td>
                <td>{(prev || 0).toFixed(2)}</td>
                <td>{(real || 0).toFixed(2)}</td>
                <td>{pct}%</td>
                <td>
                  <div className="actions">
                    <button className="icon" title="Editar" onClick={() => onEdit?.(t)}>✏️</button>
                    <button className="icon" title="Borrar" onClick={() => onDelete?.(t)}>🗑️</button>
                  </div>
                </td>
              </tr>
            );
          })}
          {!lista.length && (
            <tr>
              <td colSpan={9} style={{textAlign:'center', opacity:.7, padding:'8px 0'}}>Sin tareas</td>
            </tr>
          )}
        </tbody>
      </table>

      <style jsx>{`
        .toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
        .input,.select{border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px}
        .tbl{width:100%;border-collapse:separate;border-spacing:0 6px}
        thead th{font-weight:600;text-align:left;padding:6px 10px}
        tbody td{background:#fff;padding:10px;border-top:1px solid #eef1f5;border-bottom:1px solid #eef1f5}
        .actions{display:flex;gap:6px}
        .icon{background:#f6f7f9;border:1px solid #e5e7eb;border-radius:8px;padding:6px 8px;cursor:pointer}
        .icon:hover{background:#eef1f5}
      `}</style>
    </div>
  );
}
