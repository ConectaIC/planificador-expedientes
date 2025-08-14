'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type FilaParte = {
  id: string;
  fecha: string;
  expediente: string;
  ini: string;
  fin: string;
  horas: number;
  comentario: string;
  tarea_id: string | null;
};

export default function PartesTabla({ filasIniciales }:{ filasIniciales: FilaParte[] }) {
  const [rows, setRows] = useState<FilaParte[]>(filasIniciales || []);
  const [busyId, setBusyId] = useState<string|null>(null);
  const router = useRouter();

  async function borrar(id: string) {
    if (!confirm('¿Borrar parte? Esta acción no se puede deshacer.')) return;
    try {
      setBusyId(id);
      const resp = await fetch(`/api/partes/${id}`, { method: 'DELETE' });
      const j = await resp.json();
      if (!j?.ok) throw new Error(j?.error || 'Error al borrar');
      // 1) Quitarlo del estado inmediatamente
      setRows(prev => prev.filter(r => r.id !== id));
      // 2) Pedir un refresh del segmento (por si hay otras vistas dependientes)
      router.refresh();
    } catch (e:any) {
      alert(`No se pudo borrar: ${e.message || e}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{overflowX:'auto', marginTop:8}}>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Expediente</th>
            <th>Tarea</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Horas</th>
            <th>Comentario</th>
            <th style={{width:96, textAlign:'center'}}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.fecha}</td>
              <td>{r.expediente}</td>
              <td>{r.tarea_id ? '—' : '—'}</td>
              <td>{r.ini}</td>
              <td>{r.fin}</td>
              <td>{r.horas.toFixed(2)}</td>
              <td>{r.comentario}</td>
              <td style={{textAlign:'center'}}>
                {/* (si tienes edición, botón aquí) */}
                <button
                  onClick={() => borrar(r.id)}
                  disabled={busyId===r.id}
                  title="Borrar parte"
                  className="btn-ico"
                  aria-label="Borrar parte"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
          {rows.length===0 && (
            <tr><td colSpan={8}>No hay partes.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
