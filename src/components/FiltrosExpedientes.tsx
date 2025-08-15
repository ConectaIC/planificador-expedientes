'use client';

import { useMemo, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import ExpedienteEditModal from './ExpedienteEditModal';

export type Expediente = {
  id: string;
  codigo: string | null;
  proyecto: string | null;
  cliente: string | null;
  fin: string | null;         // yyyy-mm-dd
  prioridad: string | null;   // 'Alta' | 'Media' | 'Baja' | null
  estado: string | null;      // 'Pendiente' | 'En curso' | 'En Supervisión' | 'Entregado' | 'Cerrado'
  horasTotales?: number;      // calculado en server
};

function fmtDate(d?: string | null) {
  if (!d) return '—';
  const s = d.includes('T') ? d.split('T')[0] : d;
  const [y, m, dd] = s.split('-');
  return `${dd}/${m}/${y}`;
}

export default function FiltrosExpedientes({ expedientes }: { expedientes: Expediente[] }) {
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<'todos' | 'Pendiente' | 'En curso' | 'En Supervisión' | 'Entregado' | 'Cerrado'>('todos');
  const [prior, setPrior] = useState<'todas' | 'Alta' | 'Media' | 'Baja' | 'Sin prioridad'>('todas');
  const [orden, setOrden] = useState<'finAsc' | 'finDesc' | 'codigoAsc' | 'codigoDesc' | 'horasAsc' | 'horasDesc'>('finAsc');

  const [editExp, setEditExp] = useState<Expediente | null>(null);
  const [delExp, setDelExp] = useState<Expediente | null>(null);

  const lista = useMemo(() => {
    let out = [...(expedientes || [])];

    // Por defecto: solo activos (no Entregado/Cerrado)
    if (estado === 'todos') {
      out = out.filter(e => {
        const st = (e.estado ?? '').toLowerCase();
        return st !== 'entregado' && st !== 'cerrado';
      });
    }

    const qq = q.trim().toLowerCase();
    if (qq) {
      out = out.filter(e => {
        const bag = `${e.codigo ?? ''} ${e.proyecto ?? ''} ${e.cliente ?? ''}`.toLowerCase();
        return bag.includes(qq);
      });
    }

    if (estado !== 'todos') {
      out = out.filter(e => (e.estado ?? '') === estado);
    }

    if (prior !== 'todas') {
      if (prior === 'Sin prioridad') out = out.filter(e => !e.prioridad);
      else out = out.filter(e => (e.prioridad ?? '') === prior);
    }

    out.sort((a, b) => {
      if (orden === 'finAsc') return (a.fin ?? '9999-12-31').localeCompare(b.fin ?? '9999-12-31');
      if (orden === 'finDesc') return (b.fin ?? '0000-01-01').localeCompare(a.fin ?? '0000-01-01');
      if (orden === 'codigoAsc') return (a.codigo ?? '').localeCompare(b.codigo ?? '');
      if (orden === 'codigoDesc') return (b.codigo ?? '').localeCompare(a.codigo ?? '');
      if (orden === 'horasAsc') return (a.horasTotales ?? 0) - (b.horasTotales ?? 0);
      if (orden === 'horasDesc') return (b.horasTotales ?? 0) - (a.horasTotales ?? 0);
      return 0;
    });

    return out;
  }, [expedientes, q, estado, prior, orden]);

  async function doDelete(id: string) {
    const r = await fetch(`/api/expedientes/${id}`, { method: 'DELETE' });
    const j = await r.json();
    if (!r.ok || j.ok === false) alert(j.error || 'Error al borrar');
    else window.location.reload();
  }

  return (
    <>
      <div className="toolbar">
        <input
          className="input"
          placeholder="Buscar por código, proyecto o cliente…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="select" value={estado} onChange={(e) => setEstado(e.target.value as any)}>
          <option value="todos">Estado: activos (por defecto)</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En curso">En curso</option>
          <option value="En Supervisión">En Supervisión</option>
          <option value="Entregado">Entregado</option>
          <option value="Cerrado">Cerrado</option>
        </select>
        <select className="select" value={prior} onChange={(e) => setPrior(e.target.value as any)}>
          <option value="todas">Prioridad: todas</option>
          <option value="Alta">Alta</option>
          <option value="Media">Media</option>
          <option value="Baja">Baja</option>
          <option value="Sin prioridad">Sin prioridad</option>
        </select>
        <select className="select" value={orden} onChange={(e) => setOrden(e.target.value as any)}>
          <option value="finAsc">Orden: Fin ↑</option>
          <option value="finDesc">Orden: Fin ↓</option>
          <option value="codigoAsc">Orden: Código ↑</option>
          <option value="codigoDesc">Orden: Código ↓</option>
          <option value="horasAsc">Orden: Horas ↑</option>
          <option value="horasDesc">Orden: Horas ↓</option>
        </select>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th>Código</th>
            <th>Proyecto</th>
            <th>Cliente</th>
            <th>Fin</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Horas</th>
            <th style={{ width: 100 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((e) => (
            <tr key={e.id}>
              <td>
                {e.codigo ? (
                  <a href={`/expedientes/${encodeURIComponent(e.codigo)}`} className="link">{e.codigo}</a>
                ) : '—'}
              </td>
              <td>{e.proyecto ?? '—'}</td>
              <td>{e.cliente ?? '—'}</td>
              <td>{fmtDate(e.fin)}</td>
              <td>{e.prioridad ?? '—'}</td>
              <td>{e.estado ?? '—'}</td>
              <td>{(e.horasTotales ?? 0).toFixed(2)}</td>
              <td>
                <div className="actions">
                  <button title="Editar" onClick={() => setEditExp(e)} className="icon">✏️</button>
                  <button title="Borrar" onClick={() => setDelExp(e)} className="icon">🗑️</button>
                </div>
              </td>
            </tr>
          ))}
          {!lista.length && (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', opacity: .7, padding: '8px 0' }}>Sin expedientes</td>
            </tr>
          )}
        </tbody>
      </table>

      {editExp && (
        <ExpedienteEditModal
          open={true}
          onClose={() => setEditExp(null)}
          expediente={{
            id: editExp.id,
            codigo: editExp.codigo,
            proyecto: editExp.proyecto,
            cliente: editExp.cliente,
            fin: editExp.fin,
            prioridad: editExp.prioridad,
            estado: editExp.estado
          }}
        />
      )}
      <ConfirmDialog
        open={!!delExp}
        onClose={() => setDelExp(null)}
        title="Borrar expediente"
        message={`¿Borrar el expediente ${delExp?.codigo ?? ''}? Esta acción no se puede deshacer.`}
        confirmText="Borrar"
        onConfirm={() => delExp && doDelete(delExp.id)}
      />

      <style jsx>{`
        .toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
        .input,.select{border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px}
        .tbl{width:100%;border-collapse:separate;border-spacing:0 6px}
        thead th{font-weight:600;text-align:left;padding:6px 10px}
        tbody td{background:#fff;padding:10px;border-top:1px solid #eef1f5;border-bottom:1px solid #eef1f5}
        .actions{display:flex;gap:6px}
        .icon{background:#f6f7f9;border:1px solid #e5e7eb;border-radius:8px;padding:6px 8px;cursor:pointer}
        .icon:hover{background:#eef1f5}
        .link{color:var(--cic-primary);text-decoration:none}
        .link:hover{text-decoration:underline}
      `}</style>
    </>
  );
}
