// src/app/partes/page.tsx
// ⚠️ IMPORTANTE: ESTE ARCHIVO NO LLEVA 'use client'

import Link from 'next/link';

// ⬇️ Ajusta esta ruta a tu helper real de Supabase en el servidor.
// Por ejemplo: '@/lib/supabaseServer' o '@/lib/supabase' o '@/utils/supabase/server'
import { createClient } from '@/lib/supabaseServer';

import { CreateParteButton, EditParteButton, DeleteParteButton } from '@/components/ClientParteButtons';

// Tipos mínimos para referencias y filas
type ExpedienteRef = { id: number; codigo: string };
type TareaRef = { id: number; titulo: string };

type ParteRow = {
  id: number;
  fecha: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  horas: number | null;
  comentario: string | null;
  expediente_id: number;
  expediente_codigo?: string | null; // si tu vista lo trae
  tarea_id: number | null;
  tarea_titulo?: string | null; // si tu vista lo trae
};

export const revalidate = 0; // opcional: evita cache en producción para ver cambios al instante

export default async function PartesPage() {
  const supabase = createClient();

  // 1) Referencias para selects de los modales (expedientes, tareas)
  const { data: expedientesRefs, error: expErr } = await supabase
    .from('expedientes')
    .select('id,codigo')
    .order('codigo', { ascending: true });

  const { data: tareasRefs, error: tarErr } = await supabase
    .from('tareas')
    .select('id,titulo')
    .order('titulo', { ascending: true });

  // 2) Carga de partes. Ideal: usar una vista 'v_partes' que ya una tablas y calcule 'horas'
  //    Si no tienes la vista, cambia por la tabla 'partes' y ajusta columnas (hora_inicio, hora_fin, etc.)
  const { data: partesData, error: partesErr } = await supabase
    .from('v_partes')
    .select('*')
    .order('fecha', { ascending: false });

  if (expErr) console.error('[partes] Error expedientes:', expErr.message);
  if (tarErr) console.error('[partes] Error tareas:', tarErr.message);
  if (partesErr) {
    // Mostramos error de forma amable en UI
    return (
      <main className="container">
        <div className="card">
          <h2>Partes</h2>
          <p style={{ color: '#b91c1c' }}>
            Error al cargar partes: {partesErr.message}
          </p>
        </div>
      </main>
    );
  }

  const expedientes = (expedientesRefs || []) as ExpedienteRef[];
  const tareas = (tareasRefs || []) as TareaRef[];
  const partes = (partesData || []) as ParteRow[];

  // Formateos simples
  const fmt = (v: any) => (v === null || v === undefined || v === '' ? '—' : v);
  const fmtH = (n: any) =>
    Number.isFinite(Number(n)) ? Number(n).toFixed(2) : '—';

  return (
    <main className="container">
      {/* Cabecera con título y botón (emoji) para NUEVO parte (abre modal desde componente cliente) */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <h2>Partes</h2>
        <CreateParteButton expedientes={expedientes} tareas={tareas} />
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Expediente</th>
              <th>Tarea</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Horas</th>
              <th>Comentario</th>
              <th style={{ textAlign: 'center', width: 112 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {partes.map((p) => (
              <tr key={p.id}>
                <td>{fmt(p.fecha)}</td>

                <td>
                  {/* Si tu vista trae `expediente_codigo`, lo mostramos como enlace a su detalle */}
                  {p.expediente_codigo ? (
                    <Link
                      className="link"
                      href={`/expedientes/${encodeURIComponent(p.expediente_codigo)}`}
                    >
                      {p.expediente_codigo}
                    </Link>
                  ) : (
                    fmt(p.expediente_id)
                  )}
                </td>

                <td>{fmt(p.tarea_titulo)}</td>
                <td>{fmt(p.hora_inicio)}</td>
                <td>{fmt(p.hora_fin)}</td>
                <td>{fmtH(p.horas)}</td>
                <td>{fmt(p.comentario)}</td>

                <td style={{ textAlign: 'center' }}>
                  <div
                    className="flex gap-2 items-center"
                    style={{ justifyContent: 'center' }}
                  >
                    <EditParteButton
                      parte={{
                        id: p.id,
                        fecha: p.fecha,
                        hora_inicio: p.hora_inicio,
                        hora_fin: p.hora_fin,
                        comentario: p.comentario,
                        expediente_id: p.expediente_id,
                        tarea_id: p.tarea_id,
                      }}
                      expedientes={expedientes}
                      tareas={tareas}
                    />
                    <DeleteParteButton id={p.id} />
                  </div>
                </td>
              </tr>
            ))}

            {(!partes || partes.length === 0) && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 16 }}>
                  No hay partes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
