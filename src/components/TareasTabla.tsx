'use client';
import { useMemo } from 'react';

export type Tarea = {
  id: string;
  titulo: string;
  estado?: string | null;
  prioridad?: string | null;
  horas_previstas?: number | null;
  horas_realizadas?: number | null;
  vencimiento?: string | null;
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
  return `${Math.round((r / p) * 100)}%`;
}

// ---- Acciones UI ----
async function borrarTarea(id: string) {
  if (!confirm('¿Borrar tarea?')) return;
  const r = await fetch(`/api/tareas/${id}`, { method: 'DELETE' });
  const j = await r.json();
  if (!j?.ok) alert('Error: ' + j?.error);
  else location.reload();
}
async function editarTarea(t: Tarea) {
  const titulo = prompt('Título', t.titulo) ?? t.titulo;
  const estado = prompt('Estado (Pendiente/En curso/Entregado/En Supervisión/Cerrado)', t.estado ?? '') ?? t.estado ?? '';
  const prioridad = prompt('Prioridad (Alta/Media/Baja)', t.prioridad ?? '') ?? t.prioridad ?? '';
  const horas_previstas = prompt('Horas previstas', String(t.horas_previstas ?? '')) ?? String(t.horas_previstas ?? '');
  const venc = prompt('Vencimiento (YYYY-MM-DD)', t.vencimiento ?? '') ?? t.vencimiento ?? '';

  const r = await fetch(`/api/tareas/${t.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({
      titulo: titulo.trim(),
      estado: estado.trim() || null,
      prioridad: prioridad.trim() || null,
      horas_previstas: horas_previstas.trim() ? Number(horas_previstas) : null,
      vencimiento: venc.trim() || null
    })
  });
  const j = await r.json();
  if (!j?.ok) alert('Error: ' + j?.error);
  else location.reload();
}

export default function TareasTabla({ tareasIniciales }: { tareasIniciales: Tarea[] }) {
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
            <th>Acciones</th>
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
              <td>{typeof t.horas_realizadas === 'number' ? Number(t.horas_realizadas).toFixed(2) : (t.horas_realizadas ?? 0)}</td>
              <td>{pct(t.horas_realizadas, t.horas_previstas)}</td>
              <td style={{whiteSpace:'nowrap'}}>
                <button onClick={() => editarTarea(t)}>Editar</button>{' '}
                <button onClick={() => borrarTarea(t.id)}>Borrar</button>
              </td>
            </tr>
          )) : (
            <tr><td colSpan={8}>No hay tareas registradas.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
