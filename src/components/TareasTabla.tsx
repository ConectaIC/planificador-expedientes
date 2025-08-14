'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type TareaRow = {
  id: string;
  titulo: string;
  estado: string | null;        // Pendiente | En curso | Completada
  prioridad: string | null;     // Alta/Media/Baja
  vencimiento?: string | null;  // ISO
  horas_previstas?: number | null;
  horas_realizadas?: number | null;
};

export default function TareasTabla({ tareasIniciales }: { tareasIniciales: TareaRow[] }) {
  const [rows, setRows] = useState<TareaRow[]>(tareasIniciales || []);
  const [busyId, setBusyId] = useState<string|null>(null);
  const router = useRouter();

  function pct(r: TareaRow) {
    const p = Number(r.horas_previstas || 0);
    const h = Number(r.horas_realizadas || 0);
    return p > 0 ? Math.round((h / p) * 100) : 0;
  }

  async function toggleCompleta(r: TareaRow) {
    const nueva = (r.estado || '').toLowerCase() === 'completada' ? 'En curso' : 'Completada';
    try {
      setBusyId(r.id);
      const resp = await fetch(`/api/tareas/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ estado: nueva })
      });
      const j = await resp.json();
      if (!j?.ok) throw new Error(j?.error || 'No se pudo actualizar el estado');
      setRows(prev => prev.map(x => x.id===r.id ? { ...x, estado: nueva } : x));
      router.refresh();
    } catch(e:any) {
      alert(e.message || String(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{overflowX:'auto', marginTop:8}}>
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
            <th>Completada</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.titulo}</td>
              <td>{r.estado || '—'}</td>
              <td>{r.prioridad || '—'}</td>
              <td>{r.vencimiento ? r.vencimiento.split('T')[0].split('-').reverse().join('/') : '—'}</td>
              <td>{Number(r.horas_previstas||0)}</td>
              <td>{Number(r.horas_realizadas||0)}</td>
              <td>{pct(r)}%</td>
              <td style={{textAlign:'center'}}>
                <input
                  type="checkbox"
                  checked={(r.estado||'').toLowerCase()==='completada'}
                  onChange={()=>toggleCompleta(r)}
                  disabled={busyId===r.id}
                  title="Marcar/Desmarcar como completada"
                />
              </td>
            </tr>
          ))}
          {rows.length===0 && (
            <tr><td colSpan={8}>Sin tareas.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
