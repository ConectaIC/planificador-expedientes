'use client';

import { useMemo, useState } from 'react';

type Tarea = {
  id: number;
  expediente_id: number | null;
  titulo: string;
  horas_previstas: number | null;
  horas_realizadas: number | null;
  estado: string | null;
  prioridad: string | null;
  vencimiento: string | null;
};

type ExpedienteRef = { id: number; codigo: string };

export default function TareasClient({
  tareas,
  expedientes,
}: {
  tareas: Tarea[];
  expedientes: ExpedienteRef[];
}) {
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<string | 'all'>('all');
  const [expId, setExpId] = useState<number | 'all'>('all');

  const filtered = useMemo(() => {
    return (tareas || []).filter((t) => {
      const matchText =
        !q ||
        t.titulo?.toLowerCase().includes(q.toLowerCase()) ||
        (t.estado ?? '').toLowerCase().includes(q.toLowerCase());

      const matchEstado = estado === 'all' || (t.estado ?? '') === estado;
      const matchExp =
        expId === 'all' || (t.expediente_id ?? null) === (typeof expId === 'number' ? expId : null);

      return matchText && matchEstado && matchExp;
    });
  }, [tareas, q, estado, expId]);

  return (
    <section className="card">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-end sm:justify-between mb-3">
        <div className="flex gap-2 items-center">
          <input
            className="input"
            placeholder="Buscar título/estado…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="select"
            value={estado}
            onChange={(e) => setEstado(e.target.value as any)}
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">pendiente</option>
            <option value="en_progreso">en_progreso</option>
            <option value="completada">completada</option>
          </select>

          <select
            className="select"
            value={expId === 'all' ? 'all' : String(expId)}
            onChange={(e) =>
              setExpId(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
          >
            <option value="all">Todos los expedientes</option>
            {expedientes.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.codigo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70, textAlign: 'center' }}>ID</th>
              <th>Título</th>
              <th style={{ width: 130 }}>Vencimiento</th>
              <th style={{ width: 120, textAlign: 'center' }}>Estado</th>
              <th style={{ width: 110, textAlign: 'center' }}>Prioridad</th>
              <th style={{ width: 140, textAlign: 'center' }}>Horas</th>
              <th style={{ width: 140, textAlign: 'center' }}>Expediente</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const exp = expedientes.find((e) => e.id === (t.expediente_id ?? -1));
              return (
                <tr key={t.id}>
                  <td style={{ textAlign: 'center' }}>{t.id}</td>
                  <td>{t.titulo}</td>
                  <td>{t.vencimiento ?? '—'}</td>
                  <td style={{ textAlign: 'center' }}>{t.estado ?? '—'}</td>
                  <td style={{ textAlign: 'center' }}>{t.prioridad ?? '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {(t.horas_realizadas ?? 0)}/{t.horas_previstas ?? 0}
                  </td>
                  <td style={{ textAlign: 'center' }}>{exp ? exp.codigo : '—'}</td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '1rem' }}>
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
