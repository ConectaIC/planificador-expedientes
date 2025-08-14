'use client';

import { useMemo, useState } from 'react';

export type Expediente = {
  id: string;
  codigo?: string | null;
  proyecto?: string | null;
  cliente?: string | null;
  fin?: string | null;              // ISO yyyy-mm-dd o null
  prioridad?: string | null;        // Alta | Media | Baja | null
  estado?: string | null;           // Pendiente | En curso | Entregado | En Supervisión | Cerrado | null
  horasTotales?: number;            // calculado en page.tsx
};

type Props = { expedientes: Expediente[] };

// utilidades
function toISO(s?: string | null) {
  if (!s) return '';
  return s.includes('T') ? s.split('T')[0] : s;
}
function cmp(a: string, b: string) {
  return (a || '').localeCompare(b || '', 'es', { numeric: true, sensitivity: 'base' });
}
function num(n: unknown) {
  const v = Number(n);
  return isFinite(v) ? v : 0;
}

export default function FiltrosExpedientes({ expedientes }: Props) {
  // Controles UI
  const [q, setQ] = useState(''); // búsqueda
  const [fPrioridad, setFPrioridad] =
    useState<'todas' | 'Alta' | 'Media' | 'Baja' | 'Sin'>('todas');

  // Estado por defecto = "activos" (no Entregado ni Cerrado)
  const [fEstado, setFEstado] = useState<
    'activos' | 'todos' | 'Pendiente' | 'En curso' | 'Entregado' | 'En Supervisión' | 'Cerrado'
  >('activos');

  const [orden, setOrden] = useState<
    'codigoAsc' | 'codigoDesc' | 'finAsc' | 'finDesc' | 'horasAsc' | 'horasDesc'
  >('finAsc');

  const lista = useMemo(() => {
    const qn = q.trim().toLowerCase();
    let out = [...(expedientes || [])];

    // 1) búsqueda por código/proyecto/cliente
    if (qn) {
      out = out.filter(e => {
        const s = `${e.codigo || ''} ${e.proyecto || ''} ${e.cliente || ''}`.toLowerCase();
        return s.includes(qn);
      });
    }

    // 2) filtro por prioridad
    if (fPrioridad !== 'todas') {
      if (fPrioridad === 'Sin') {
        out = out.filter(e => !e.prioridad || e.prioridad.trim() === '');
      } else {
        out = out.filter(
          e => (e.prioridad || '').toLowerCase() === fPrioridad.toLowerCase()
        );
      }
    }

    // 3) filtro por estado (activos por defecto)
    if (fEstado === 'activos') {
      out = out.filter(e => {
        const est = (e.estado || '').toLowerCase();
        return est !== 'entregado' && est !== 'cerrado';
      });
    } else if (fEstado !== 'todos') {
      out = out.filter(e => (e.estado || '').toLowerCase() === fEstado.toLowerCase());
    }

    // 4) orden
    switch (orden) {
      case 'codigoAsc':  out.sort((a,b) => cmp(a.codigo||'', b.codigo||'')); break;
      case 'codigoDesc': out.sort((a,b) => cmp(b.codigo||'', a.codigo||'')); break;
      case 'finAsc':     out.sort((a,b) => cmp(toISO(a.fin), toISO(b.fin))); break;
      case 'finDesc':    out.sort((a,b) => cmp(toISO(b.fin), toISO(a.fin))); break;
      case 'horasAsc':   out.sort((a,b) => num(a.horasTotales) - num(b.horasTotales)); break;
      case 'horasDesc':  out.sort((a,b) => num(b.horasTotales) - num(a.horasTotales)); break;
    }

    return out;
  }, [q, fPrioridad, fEstado, orden, expedientes]);

  return (
    <>
      {/* Controles */}
      <div
        style={{
          display: 'grid',
          gap: 8,
          gridTemplateColumns: '1fr repeat(3, 220px)',
          alignItems: 'center',
          margin: '8px 0 12px'
        }}
      >
        <input
          type="text"
          placeholder="Buscar por código, proyecto o cliente…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />

        <select
          value={fPrioridad}
          onChange={e => setFPrioridad(e.target.value as any)}
          title="Filtrar por prioridad"
        >
          <option value="todas">Prioridad: todas</option>
          <option value="Alta">Alta</option>
          <option value="Media">Media</option>
          <option value="Baja">Baja</option>
          <option value="Sin">Sin prioridad</option>
        </select>

        <select
          value={fEstado}
          onChange={e => setFEstado(e.target.value as any)}
          title="Filtrar por estado"
        >
          <option value="activos">Estado: activos</option>
          <option value="todos">Todos</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En curso">En curso</option>
          <option value="Entregado">Entregado</option>
          <option value="En Supervisión">En Supervisión</option>
          <option value="Cerrado">Cerrado</option>
        </select>

        <select
          value={orden}
          onChange={e => setOrden(e.target.value as any)}
          title="Ordenar"
        >
          <option value="finAsc">Orden: Fin ↑</option>
          <option value="finDesc">Orden: Fin ↓</option>
          <option value="codigoAsc">Orden: Código ↑</option>
          <option value="codigoDesc">Orden: Código ↓</option>
          <option value="horasAsc">Orden: Horas ↑</option>
          <option value="horasDesc">Orden: Horas ↓</option>
        </select>
      </div>

      <div style={{ marginBottom: 8, color: 'var(--muted)' }}>
        Coincidencias: {lista.length}
      </div>

      {/* Tabla */}
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Proyecto</th>
              <th>Cliente</th>
              <th>Fin</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Horas imputadas</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(e => (
              <tr key={e.id}>
                <td>{e.codigo || '—'}</td>
                <td>{e.proyecto || '—'}</td>
                <td>{e.cliente || '—'}</td>
                <td>
                  {toISO(e.fin) ? toISO(e.fin).split('-').reverse().join('/') : '—'}
                </td>
                <td>{e.prioridad || '—'}</td>
                <td>{e.estado || '—'}</td>
                <td>{num(e.horasTotales).toFixed(2)} h</td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={7}>Sin resultados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
