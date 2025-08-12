'use client';
import { useState } from 'react';

type Tarea = {
  id: string;
  titulo: string;
  estado?: string | null;
  prioridad?: string | null;
  horas_previstas?: number | null;
  horas_realizadas?: number | null;
  vencimiento?: string | null;
};

export default function TareasTabla({ tareasIniciales }: { tareasIniciales: Tarea[] }) {
  const [tareas, setTareas] = useState<Tarea[]>(tareasIniciales);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function patch(id: string, payload: any) {
    setSavingId(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/tareas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || 'Error al guardar');

      // Actualiza el estado local
      setTareas(prev => prev.map(t => t.id === id ? { ...t, ...payload } : t));
      setMsg('✔ Cambios guardados');
      setTimeout(() => setMsg(null), 1500);
    } catch (e: any) {
      setMsg('Error: ' + e.message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Título</th>
            <th>Estado</th>
            <th>Prioridad</th>
            <th>Previstas (h)</th>
            <th>Realizadas (h)</th>
            <th>Vencimiento</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tareas.length ? tareas.map(t => (
            <tr key={t.id}>
              <td>{t.titulo}</td>
              <td>{t.estado ?? 'Pendiente'}</td>
              <td>{t.prioridad ?? '—'}</td>
              <td>{t.horas_previstas ?? '—'}</td>
              <td style={{ minWidth: 110 }}>
                <input
                  type="number" step="0.25" min="0"
                  defaultValue={t.horas_realizadas ?? ''}
                  onChange={e => {
                    const v = e.currentTarget.value;
                    setTareas(prev => prev.map(x => x.id === t.id
                      ? { ...x, horas_realizadas: v === '' ? null : Number(v) }
                      : x));
                  }}
                  style={{ width: '100%' }}
                />
              </td>
              <td>{t.vencimiento ? new Date(t.vencimiento).toLocaleDateString('es-ES') : '—'}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={savingId === t.id}
                  onClick={() => patch(t.id, { horas_realizadas: t.horas_realizadas ?? null })}
                >
                  {savingId === t.id ? 'Guardando…' : 'Guardar'}
                </button>
                <button
                  disabled={savingId === t.id || t.estado === 'Hecha'}
                  onClick={() => patch(t.id, { estado: 'Hecha' })}
                >
                  {t.estado === 'Hecha' ? 'Hecha ✓' : '✔ Hecha'}
                </button>
              </td>
            </tr>
          )) : (
            <tr><td colSpan={7}>Sin tareas aún.</td></tr>
          )}
        </tbody>
      </table>
      {msg && <p>{msg}</p>}
    </>
  );
}
