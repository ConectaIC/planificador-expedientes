'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Parte = {
  id: string;
  fecha: string | null;
  inicio: string;
  fin: string;
  horas: number;
  comentario: string;
  expediente: string;   // texto mostrado
  tarea_id: string | null;
};

export default function PartesTabla({ partesIniciales }: { partesIniciales: Parte[] }) {
  const [rows, setRows] = useState<Parte[]>(partesIniciales || []);
  const [busyId, setBusyId] = useState<string|null>(null);
  const router = useRouter();

  async function borrar(p: Parte) {
    if (!confirm('¿Borrar este parte?')) return;
    try {
      setBusyId(p.id);
      const r = await fetch(`/api/partes/${p.id}`, { method: 'DELETE' });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || 'No se pudo borrar');
      // quita localmente y refresca para que no quede rastro
      setRows(prev => prev.filter(x => x.id !== p.id));
      router.refresh();
    } catch (e:any) {
      alert(e.message || String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function editar(p: Parte) {
    // editor sencillo con prompts (rápido). Si prefieres modal, lo hacemos.
    const fecha = prompt('Fecha (YYYY-MM-DD)', p.fecha || '') ?? p.fecha;
    if (fecha === null) return;

    const inicio = prompt('Hora inicio (HH:MM:SS)', p.inicio) ?? p.inicio;
    if (inicio === null) return;

    const fin = prompt('Hora fin (HH:MM:SS)', p.fin) ?? p.fin;
    if (fin === null) return;

    const horasStr = prompt('Horas (decimal)', String(p.horas)) ?? String(p.horas);
    if (horasStr === null) return;
    const horas = Number(horasStr);

    const comentario = prompt('Comentario', p.comentario) ?? p.comentario;
    if (comentario === null) return;

    try {
      setBusyId(p.id);
      const r = await fetch(`/api/partes/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          fecha, hora_inicio: inicio, hora_fin: fin, horas, comentario
        })
      });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || 'No se pudo editar');

      // actualiza local y refresca
      setRows(prev => prev.map(x => x.id === p.id ? { ...x, fecha, inicio, fin, horas, comentario } : x));
      router.refresh();
    } catch (e:any) {
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
            <th>Fecha</th>
            <th>Expediente</th>
            <th>Tarea</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Horas</th>
            <th>Comentario</th>
            <th style={{textAlign:'center', width:90}}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(p => (
            <tr key={p.id}>
              <td>{p.fecha ? p.fecha.split('-').reverse().join('/') : '—'}</td>
              <td>{p.expediente}</td>
              <td>—{/* (opcional: nombre de tarea si haces join) */}</td>
              <td>{p.inicio || '—'}</td>
              <td>{p.fin || '—'}</td>
              <td>{(Number(p.horas)||0).toFixed(2)}</td>
              <td>{p.comentario || '—'}</td>
              <td style={{textAlign:'center', whiteSpace:'nowrap'}}>
                <button
                  className="btn-ico"
                  title="Editar parte"
                  aria-label="Editar parte"
                  disabled={busyId===p.id}
                  onClick={()=>editar(p)}
                >✏️</button>
                <button
                  className="btn-ico"
                  title="Borrar parte"
                  aria-label="Borrar parte"
                  disabled={busyId===p.id}
                  onClick={()=>borrar(p)}
                  style={{marginLeft:6}}
                >🗑️</button>
              </td>
            </tr>
          ))}
          {rows.length===0 && (
            <tr><td colSpan={8}>Sin partes en el rango mostrado.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
