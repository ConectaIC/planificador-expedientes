'use client';
import { useMemo, useState } from 'react';

export type Expediente = {
  id: string;
  codigo: string;
  proyecto: string;
  cliente?: string | null;
  fin?: string | null;
  prioridad?: string | null; // Alta | Media | Baja | null
  estado?: string | null;    // Pendiente | En curso | Entregado | En Supervisión | Cerrado | null
  horasTotales?: number;     // suma de partes
};

type Props = { expedientes: Expediente[] };

export default function FiltrosExpedientes({ expedientes }: Props) {
  const [query, setQuery] = useState('');
  const [pri, setPri] = useState<'todas'|'Alta'|'Media'|'Baja'>('todas');
  const [est, setEst] = useState<'todos'|'Pendiente'|'En curso'|'Entregado'|'En Supervisión'|'Cerrado'>('todos');
  const [orden, setOrden] = useState<'finAsc'|'finDesc'|'codigoAsc'|'codigoDesc'|'horasAsc'|'horasDesc'>('finAsc');

  // ---- Acciones ----
  async function borrarExpediente(id: string) {
    if (!confirm('¿Borrar expediente? Esta acción no se puede deshacer.\n(Nota: si tiene tareas/parts relacionados puede fallar por restricciones).')) return;
    const r = await fetch(`/api/expedientes/${id}`, { method: 'DELETE' });
    const j = await r.json();
    if (!j?.ok) alert('Error: ' + j?.error);
    else location.reload();
  }

  async function editarExpediente(e: Expediente) {
    const nuevoCodigo = prompt('Código', e.codigo) ?? e.codigo;
    const nuevoProyecto = prompt('Proyecto', e.proyecto) ?? e.proyecto;
    const nuevoCliente = prompt('Cliente', e.cliente ?? '') ?? e.cliente ?? '';
    const nuevoFin = prompt('Fin (YYYY-MM-DD)', e.fin ?? '') ?? e.fin ?? '';
    const nuevaPrioridad = prompt('Prioridad (Alta/Media/Baja)', e.prioridad ?? '') ?? e.prioridad ?? '';
    const nuevoEstado = prompt('Estado (Pendiente/En curso/Entregado/En Supervisión/Cerrado)', e.estado ?? '') ?? e.estado ?? '';

    const payload = {
      codigo: nuevoCodigo.trim(),
      proyecto: nuevoProyecto.trim(),
      cliente: (nuevoCliente || '').trim() || null,
      fin: (nuevoFin || '').trim() || null,
      prioridad: (nuevaPrioridad || '').trim() || null,
      estado: (nuevoEstado || '').trim() || null,
    };

    const r = await fetch(`/api/expedientes/${e.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const j = await r.json();
    if (!j?.ok) alert('Error: ' + j?.error);
    else location.reload();
  }

  // ---- Filtrado & Ordenación ----
  const filtrados = useMemo(() => {
    let out = (expedientes || []).slice();

    // texto
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(e =>
        (e.codigo || '').toLowerCase().includes(q) ||
        (e.proyecto || '').toLowerCase().includes(q) ||
        (e.cliente || '').toLowerCase().includes(q)
      );
    }

    // prioridad
    if (pri !== 'todas') {
      out = out.filter(e => (e.prioridad || '').toLowerCase() === pri.toLowerCase());
    }

    // estado
    if (est !== 'todos') {
      out = out.filter(e => (e.estado || '').toLowerCase() === est.toLowerCase());
    }

    // orden
    switch (orden) {
      case 'finAsc':
        out.sort((a,b) => (a.fin || '9999').localeCompare(b.fin || '9999')); break;
      case 'finDesc':
        out.sort((a,b) => (b.fin || '0000').localeCompare(a.fin || '0000')); break;
      case 'codigoAsc':
        out.sort((a,b) => (a.codigo||'').localeCompare(b.codigo||'')); break;
      case 'codigoDesc':
        out.sort((a,b) => (b.codigo||'').localeCompare(a.codigo||'')); break;
      case 'horasAsc':
        out.sort((a,b) => (a.horasTotales||0) - (b.horasTotales||0)); break;
      case 'horasDesc':
        out.sort((a,b) => (b.horasTotales||0) - (a.horasTotales||0)); break;
    }

    return out;
  }, [expedientes, query, pri, est, orden]);

  return (
    <section>
      <div style={{display:'grid', gridTemplateColumns:'1fr 200px 200px 200px', gap:8, alignItems:'center'}}>
        <input
          placeholder="Buscar por código, proyecto o cliente"
          value={query} onChange={e=>setQuery(e.target.value)}
        />
        <select value={pri} onChange={e=>setPri(e.target.value as any)}>
          <option value="todas">Prioridad: todas</option>
          <option value="Alta">Alta</option>
          <option value="Media">Media</option>
          <option value="Baja">Baja</option>
        </select>
        <select value={est} onChange={e=>setEst(e.target.value as any)}>
          <option value="todos">Estado: todos</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En curso">En curso</option>
          <option value="Entregado">Entregado</option>
          <option value="En Supervisión">En Supervisión</option>
          <option value="Cerrado">Cerrado</option>
        </select>
        <select value={orden} onChange={e=>setOrden(e.target.value as any)}>
          <option value="finAsc">Orden: Fin ↑</option>
          <option value="finDesc">Orden: Fin ↓</option>
          <option value="codigoAsc">Orden: Código ↑</option>
          <option value="codigoDesc">Orden: Código ↓</option>
          <option value="horasAsc">Orden: Horas ↑</option>
          <option value="horasDesc">Orden: Horas ↓</option>
        </select>
      </div>

      <p style={{marginTop:6}}>Coincidencias: {filtrados.length} / {expedientes.length}</p>

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
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.length ? filtrados.map(e => (
            <tr key={e.id}>
              <td>
                <a href={`/expedientes/${encodeURIComponent(e.codigo)}`}>{e.codigo}</a>
              </td>
              <td>{e.proyecto || '—'}</td>
              <td>{e.cliente || '—'}</td>
              <td>{e.fin ? new Date(e.fin).toLocaleDateString('es-ES') : '—'}</td>
              <td>{e.prioridad || '—'}</td>
              <td>{e.estado || '—'}</td>
              <td>{(e.horasTotales ?? 0).toFixed(2)} h</td>
              <td style={{whiteSpace:'nowrap'}}>
                <button onClick={() => editarExpediente(e)}>Editar</button>{' '}
                <button onClick={() => borrarExpediente(e.id)}>Borrar</button>
              </td>
            </tr>
          )) : (
            <tr><td colSpan={8}>Sin expedientes.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
