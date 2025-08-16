// src/app/expedientes/[codigo]/page.tsx
import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabaseServer';
import ClientNewTask from '@/components/ClientNewTask';
import ClientTaskActions from '@/components/ClientTaskActions';

type ExpedienteMini = { id: number; codigo: string; proyecto: string };
type Tarea = {
  id: number;
  expediente_id: number;
  titulo: string;
  horas_previstas: number | null;
  horas_realizadas: number | null;
  estado: 'Pendiente' | 'En curso' | 'Completada' | null;
  prioridad: 'Baja' | 'Media' | 'Alta' | null;
  vencimiento: string | null;
};

async function fetchExpedienteYtareas(codigo: string) {
  const supabase = createClient(cookies());

  const { data: exp, error: e1 } = await supabase
    .from('expedientes')
    .select('*')
    .eq('codigo', codigo)
    .maybeSingle();

  if (e1) throw new Error(`No se pudo cargar el expediente “${codigo}”: ${e1.message}`);
  if (!exp) notFound();

  const { data: tareas, error: e2 } = await supabase
    .from('tareas')
    .select('*')
    .eq('expediente_id', exp.id)
    .order('vencimiento', { ascending: true, nullsFirst: true });

  if (e2) throw new Error(`Error al cargar tareas del expediente: ${e2.message}`);

  // Para selects en modales (por si se necesita cambiar expediente de tarea)
  const { data: expsMini } = await supabase
    .from('expedientes')
    .select('id,codigo,proyecto')
    .order('codigo', { ascending: true });

  return { exp, tareas: (tareas ?? []) as Tarea[], expsMini: (expsMini ?? []) as ExpedienteMini[] };
}

// Server Actions para tareas
export async function createTask(fd: FormData) {
  'use server';
  const supabase = createClient(cookies());
  const payload = {
    expediente_id: Number(fd.get('expediente_id')),
    titulo: String(fd.get('titulo') || '').trim(),
    horas_previstas: Number(fd.get('horas_previstas') || 0) || null,
    estado: (String(fd.get('estado') || '') || null) as any,
    prioridad: (String(fd.get('prioridad') || '') || null) as any,
    vencimiento: String(fd.get('vencimiento') || '') || null,
  };
  const { error } = await supabase.from('tareas').insert(payload);
  if (error) throw new Error(`No se pudo crear la tarea: ${error.message}`);
  revalidatePath('/expedientes');
  revalidatePath(`/expedientes/${encodeURIComponent(fd.get('expediente_codigo') as string || '')}`);
}

export async function updateTask(fd: FormData) {
  'use server';
  const supabase = createClient(cookies());
  const id = Number(fd.get('id'));
  const payload: any = {
    titulo: String(fd.get('titulo') || '').trim(),
    horas_previstas: Number(fd.get('horas_previstas') || 0) || null,
    estado: String(fd.get('estado') || '') || null,
    prioridad: String(fd.get('prioridad') || '') || null,
    vencimiento: String(fd.get('vencimiento') || '') || null,
  };
  const { error } = await supabase.from('tareas').update(payload).eq('id', id);
  if (error) throw new Error(`No se pudo actualizar la tarea: ${error.message}`);
  revalidatePath('/expedientes');
}

export async function deleteTask(fd: FormData) {
  'use server';
  const supabase = createClient(cookies());
  const id = Number(fd.get('id'));
  const { error } = await supabase.from('tareas').delete().eq('id', id);
  if (error) throw new Error(`No se pudo borrar la tarea: ${error.message}`);
  revalidatePath('/expedientes');
}

export default async function Page({ params }: { params: { codigo: string } }) {
  const { codigo } = params;
  const { exp, tareas, expsMini } = await fetchExpedienteYtareas(codigo);

  return (
    <main className="container">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h2>Expediente · {exp.codigo}</h2>
          <div className="text-muted">{exp.proyecto}</div>
        </div>
        <ClientNewTask expedienteId={exp.id} expedienteCodigo={exp.codigo} action={createTask} />
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Tarea</th>
                <th style={{ width: 120, textAlign: 'right' }}>H. prev.</th>
                <th style={{ width: 120, textAlign: 'right' }}>H. real.</th>
                <th style={{ width: 130 }}>Estado</th>
                <th style={{ width: 110 }}>Prioridad</th>
                <th style={{ width: 120 }}>Vencimiento</th>
                <th style={{ width: 90, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tareas.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 16 }}>No hay tareas en este expediente.</td>
                </tr>
              ) : (
                tareas.map((t) => (
                  <tr key={t.id}>
                    <td>{t.titulo}</td>
                    <td style={{ textAlign: 'right' }}>{Number(t.horas_previstas ?? 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{Number(t.horas_realizadas ?? 0).toFixed(2)}</td>
                    <td>{t.estado ?? '—'}</td>
                    <td>{t.prioridad ?? '—'}</td>
                    <td>{t.vencimiento ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <ClientTaskActions
                        tarea={t}
                        expedientes={expsMini}
                        updateAction={updateTask}
                        deleteAction={deleteTask}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <Link href="/expedientes" className="btn">⬅ Volver</Link>
        </div>
      </div>
    </main>
  );
}
