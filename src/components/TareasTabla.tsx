'use client';
import { useMemo } from 'react';

export type Tarea = {
  id: string;
  titulo: string;
  estado?: string | null;           // Pendiente | En curso | Entregado | En Supervisión | Cerrado
  prioridad?: string | null;        // Alta | Media | Baja (opcional)
  horas_previstas?: number | null;  // horas estimadas
  horas_realizadas?: number | null; // horas imputadas (suma de partes vinculados)
  vencimiento?: string | null;      // ISO date string
};

function fmtFechaES(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(+dt) ? '—' : dt.toLocaleDateString('es-ES');
}

function pct(hReal?: number | null, hPrev?: number | null) {
  const r = Number(hReal || 0);
  const p = Number(hPrev || 0);
  if (!p || isNaN(p)) return '—';
  const val = Math.round((r / p) * 100);
  return `${val}%`;
}

export default function TareasTabla({ tareasIniciales }: { tareasIniciales: Tarea[] }) {
  // Ordenar por vencimiento ascendente (las sin fecha al final)
  const tareas = useMemo(() => {
    const arr = (tareasIniciales || []).slice();
    arr.sort((a, b) => {
      const aa = a.vencimiento ? new Date(a.vencimiento).getTime() : Number.POSITIVE_INFINITY;
      const bb = b.vencimiento ? new Date(b.vencimiento).getTime() : Number.POSITIVE_INFINITY;
      return aa - bb;
    });
    return arr;
  }, [tareasIniciales]);

  return (
    <section style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Título</th>
            <th>Estado</th>
            <th>Prioridad</th>
            <th>Vencimiento</th>
            <th>Previstas (h)</th>
            <th>Realizadas (h)</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          {tareas.length ? tareas.map(t => (
            <tr key={t.id}>
              <td>{t.titulo}</td>
              <td>{t.estado ?? '—'}</td>
              <td>{t.prioridad ?? '—'}</td>
              <td>{fmtFechaES(t.vencimiento)}</td>
              <td>{typeof t.horas_previstas === 'number' ? t.horas_previstas : (t.horas_previstas ?? '—')}</td>
              <td>{typeof t.horas_realizadas === 'number'
                    ? Number(t.horas_realizadas).toFixed(2)
                    : (t.horas_realizadas ?? 0)}</td>
              <td>{pct(t.horas_realizadas, t.horas_previstas)}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={7}>No hay tareas registradas.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
