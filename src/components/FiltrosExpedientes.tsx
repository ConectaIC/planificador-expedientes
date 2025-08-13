'use client';
import { useMemo, useState } from 'react';

export type Expediente = {
  id: string;
  codigo: string;
  proyecto: string;
  cliente?: string | null;
  fin?: string | null;
  prioridad?: string | null;
  estado?: string | null;
  horasTotales?: number; // lo rellenaremos desde la página
};

function fmtES(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(+dt) ? '—' : dt.toLocaleDateString('es-ES');
}

export default function FiltrosExpedientes({ expedientes }: { expedientes: Expediente[] }) {
  const [q, setQ] = useState('');
  const [pri, setPri] = useState<string>('');
  const [est, setEst] = useState<string>('');
  const [orden, setOrden] = useState<'finAsc' | 'finDesc' | 'codigoAsc' | 'codigoDesc'>('finAsc');

  const filtra = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = expedientes.slice();

    if (needle) {
      out = out.filter(e =>
        (e.codigo || '').toLowerCase().includes(needle) ||
        (e.proyecto || '').toLowerCase().includes(needle) ||
        (e.cliente || '').toLowerCase().includes(needle)
      );
    }
    if (pri) out = out.filter(e => (e.prioridad || '') === pri);
    if (est) out = out.filter(e => (e.estado || '') === est);

    switch (orden) {
      case 'finAsc':
        out.sort((a,b) => new Date(a.fin||0).getTime() - new Date(b.fin||0).getTime()); break;
      case 'finDesc':
        out.sort((a,b) => new Date(b.fin||0).getTime() - new Date(a.fin||0).getTime()); break;
      case 'codigoAsc':
        out.sort((a,b) => (a.codigo||'').localeCompare(b.codigo||'')); break;
      case 'codigoDesc':
        out.sort((a,b) => (b.codigo||'').localeCompare(a.codigo||'')); break;
    }
    return out;
  }, [expedientes, q, pri, est, orden]);

  return (
    <>
      <section style={{ display:'grid', gap:8, margin: '8px 0' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8 }}>
          <input
            placeholder="Buscar por código, proyecto o cliente…"
            value={q} onChange={e=>setQ(e.target.value)}
          />
          <select value={pri} onChange={e=>setPri(e.target.value)}>
            <option value="">Prioridad: todas</option>
            <option>Alta</option><option>Media</option><option>Baja</option>
          </select>
<select value={est} onChange={e=>setEst(e.target.value)}>
  <option value="">Estado: todos</option>
  <option>Pendiente</option>
  <option>En curso</option>
  <option>Entregado</option>
  <option>En Supervisión</option>
  <option>Cerrado</option>
</select>
          <select value={orden} onChange={e=>setOrden(e.target.value as any)}>
            <option value="finAsc">Orden: Fin ↑</option>
            <option value="finDesc">Orden: Fin ↓</option>
            <option value="codigoAsc">Orden: Código ↑</option>
            <option value="codigoDesc">Orden: Código ↓</option>
          </select>
        </div>
        <small style={{ opacity: .7 }}>
          Coincidencias: {filtra.length} / {expedientes.length}
        </small>
      </section>

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
          {filtra.map(e => (
            <tr key={e.id}>
              <td><a href={`/expedientes/${e.codigo}`}><strong>{e.codigo}</strong></a></td>
              <td>{e.proyecto}</td>
              <td>{e.cliente ?? '—'}</td>
              <td>{fmtES(e.fin)}</td>
              <td>{e.prioridad ?? '—'}</td>
              <td>{e.estado ?? '—'}</td>
              <td>{(e.horasTotales ?? 0).toFixed(2)} h</td>
            </tr>
          ))}
          {filtra.length === 0 && (
            <tr><td colSpan={7}>Sin resultados</td></tr>
          )}
        </tbody>
      </table>
    </>
  );
}
