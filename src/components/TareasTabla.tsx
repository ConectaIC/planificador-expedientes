'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Tarea } from '@/types/tareas';

type Props = {
  tareas: Tarea[];
  expedienteId?: string;
};

function fmtDate(d?: string | null) {
  if (!d) return '—';
  const ymd = d.includes('T') ? d.split('T')[0] : d;
  const [y, m, day] = ymd.split('-');
  return `${day}/${m}/${y}`;
}
function pct(done?: number | null, planned?: number | null) {
  const d = Number(done ?? 0);
  const p = Number(planned ?? 0);
  if (!p) return '0%';
  return `${Math.round((d / p) * 100)}%`;
}

export default function TareasTabla({ tareas, expedienteId }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<Tarea[]>(tareas || []);
  const [busy, setBusy] = useState<string | null>(null);

  const totales = useMemo(
    () =>
      rows.reduce(
        (acc, t) => {
          acc.previstas += Number(t.horas_previstas ?? 0);
          acc.realizadas += Number(t.horas_realizadas ?? 0);
          return acc;
        },
        { previstas: 0, realizadas: 0 }
      ),
    [rows]
  );

  async function onDelete(t: Tarea) {
    if (!confirm(`¿Borrar la tarea "${t.titulo}"? Esta acción no se puede deshacer.`)) return;
    try {
      setBusy(t.id);
      const r = await fetch(`/api/tareas/${t.id}`, { method: 'DELETE' });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || 'No se pudo borrar la tarea');
      setRows(prev => prev.filter(x => x.id !== t.id));
      router.refresh();
    } catch (e: any) {
      alert(e.message || String(e));
    } finally {
      setBusy(null);
    }
  }

  async function onEdit(t: Tarea) {
    const titulo = prompt('Título', t.titulo);
    if (titulo === null) return;

    const estado = (prompt('Estado (Pendiente | En curso | Completada)', t.estado) || t.estado) as Tarea['estado'];
    const prioridad = (prompt('Prioridad (Alta | Media | Baja | dejar vacío)', t.prioridad ?? '') || null) as
      | 'Alta'
      | 'Media'
      | 'Baja'
      | null;

    const venc = prompt('Vencimiento (YYYY-MM-DD, vacío para quitar)', t.vencimiento ?? '') || null;
    const hp = Number(prompt('Horas previstas (decimal)', String(t.horas_previstas ?? 0)) ?? t.horas_previstas ?? 0);
    const hr = Number(prompt('Horas realizadas (decimal)', String(t.horas_realizadas ?? 0)) ?? t.horas_realizadas ?? 0);

    try {
      setBusy(t.id);
      const r = await fetch(`/api/tareas/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          estado,
          prioridad,
          vencimiento: venc,
          horas_previstas: hp,
          horas_realizadas: hr,
        }),
      });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || 'No se pudo editar la tarea');

      setRows(prev =>
        prev.map(x =>
          x.id === t.id
            ? { ...x, titulo, estado, prioridad, vencimiento: venc, horas_previstas: hp, horas_realizadas: hr }
            : x
        )
      );
      router.refresh();
    } catch (e: any) {
      alert(e.message || String(e));
    } finally {
      setBusy(null);
    }
  }

  async function toggleCompletada(t: Tarea) {
    const nuevo = t.estado === 'Completada' ? 'En curso' : 'Completada';
    try {
      setBusy(t.id);
      const r = await fetch(`/api/tareas/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevo }),
      });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || 'No se pudo actualizar el estado');
      setRows(prev => prev.map(x => (x.id === t.id ? { ...x, estado: nuevo } : x)));
      router.refresh();
    } catch (e: any) {
      alert(e.message || String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ overflowX: 'auto', marginTop: 8 }}>
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
            <th style={{ textAlign: 'center', width: 100 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(t => (
            <tr key={t.id}>
              <td>{t.titulo}</td>
              <td>
                {t.estado}{' '}
                <label style={{ marginLeft: 8, userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={t.estado === 'Completada'}
                    onChange={() => toggleCompletada(t)}
                    disabled={busy === t.id}
                    style={{ marginRight: 4 }}
                  />
                  compl.
                </label>
              </td>
              <td>{t.prioridad ?? '—'}</td>
              <td>{fmtDate(t.vencimiento)}</td>
              <td>{Number(t.horas_previstas ?? 0).toFixed(2)}</td>
              <td>{Number(t.horas_realizadas ?? 0).toFixed(2)}</td>
              <td>{pct(t.horas_realizadas, t.horas_previstas)}</td>
              <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                <button
                  className="btn-ico"
                  title="Editar tarea"
                  aria-label="Editar tarea"
                  disabled={busy === t.id}
                  onClick={() => onEdit(t)}
                >
                  ✏️
                </button>
                <button
                  className="btn-ico"
                  title="Borrar tarea"
                  aria-label="Borrar tarea"
                  disabled={busy === t.id}
                  onClick={() => onDelete(t)}
                  style={{ marginLeft: 6 }}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8}>Sin tareas.</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>
              Totales:
            </td>
            <td>{totales.previstas.toFixed(2)}</td>
            <td>{totales.realizadas.toFixed(2)}</td>
            <td>{pct(totales.realizadas, totales.previstas)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
