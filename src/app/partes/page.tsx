// src/app/partes/page.tsx
import { createClient } from '@/lib/supabaseServer';
import ClientCreateParte from '@/components/ClientCreateParte';
import ClientDeleteParte from '@/components/ClientDeleteParte';

type Parte = {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  horas: number;
  comentario: string | null;
  expediente_id: number | null;
  tarea_id: number | null;
};

type ExpedienteRef = { id: number; codigo: string };
type TareaRef = { id: number; titulo: string };

async function fetchData() {
  const supabase = createClient();

  const { data: partes, error: e1 } = await supabase
    .from('partes')
    .select('id,fecha,hora_inicio,hora_fin,horas,comentario,expediente_id,tarea_id')
    .order('fecha', { ascending: false });

  if (e1) return { error: e1.message } as const;

  const { data: expedientes, error: e2 } = await supabase
    .from('expedientes')
    .select('id,codigo')
    .order('codigo', { ascending: true });

  if (e2) return { error: e2.message } as const;

  const { data: tareas, error: e3 } = await supabase
    .from('tareas')
    .select('id,titulo')
    .order('titulo', { ascending: true });

  if (e3) return { error: e3.message } as const;

  return {
    partes: (partes || []) as Parte[],
    expedientes: (expedientes || []) as ExpedienteRef[],
    tareas: (tareas || []) as TareaRef[],
  } as const;
}

// ---- Server Actions locales (simples) ----
import { revalidatePath } from 'next/cache';
async function createParteAction(fd: FormData) {
  'use server';
  const supabase = createClient();
  const payload = {
    fecha: (fd.get('fecha') || '').toString(),
    hora_inicio: (fd.get('hora_inicio') || '').toString(),
    hora_fin: (fd.get('hora_fin') || '').toString(),
    horas: Number(fd.get('horas') || 0),
    comentario: (fd.get('comentario') || '').toString().trim() || null,
    expediente_id: fd.get('expediente_id') ? Number(fd.get('expediente_id')) : null,
    tarea_id: fd.get('tarea_id') ? Number(fd.get('tarea_id')) : null,
  };
  const { error } = await supabase.from('partes').insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/partes');
  return { ok: true };
}

async function deleteParteAction(id: number) {
  'use server';
  const supabase = createClient();
  const { error } = await supabase.from('partes').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/partes');
  return { ok: true };
}

export default async function PartesPage() {
  const res = await fetchData();
  if ('error' in res) {
    return <main className="container"><p className="error">Error al cargar partes: {res.error}</p></main>;
  }

  const { partes, expedientes, tareas } = res;

  return (
    <main className="container">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h2>Partes</h2>
        <ClientCreateParte expedientes={expedientes} tareas={tareas} onCreate={createParteAction} />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th style={{ textAlign: 'right' }}>Horas</th>
              <th>Comentario</th>
              <th>Expediente</th>
              <th>Tarea</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {partes.map(p => (
              <tr key={p.id}>
                <td>{p.fecha}</td>
                <td>{p.hora_inicio}</td>
                <td>{p.hora_fin}</td>
                <td style={{ textAlign: 'right' }}>{p.horas.toFixed(1)}</td>
                <td>{p.comentario ?? '—'}</td>
                <td>{expedientes.find(e => e.id === p.expediente_id)?.codigo ?? '—'}</td>
                <td>{tareas.find(t => t.id === p.tarea_id)?.titulo ?? '—'}</td>
                <td style={{ textAlign: 'center' }}>
                  <ClientDeleteParte id={p.id} onDelete={deleteParteAction} />
                </td>
              </tr>
            ))}
            {partes.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', opacity: .7 }}>No hay partes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
