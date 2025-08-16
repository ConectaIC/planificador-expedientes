// src/app/tareas/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabaseServer';

/** Convierte "HH:MM" o "HH:MM:SS" a minutos enteros */
function parseTimeToMinutes(t: unknown): number {
  if (typeof t !== 'string' || !t) return NaN;
  const [hh, mm, ss] = t.split(':').map((x) => Number(x));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return NaN;
  const s = Number.isFinite(ss) ? ss : 0;
  return hh * 60 + mm + s / 60;
}

/** Suma horas de las partes de una tarea y guarda en tareas.horas_realizadas */
export async function recomputeTareaHours(tareaId: number) {
  if (!Number.isFinite(tareaId)) return;
  const supabase = createClient();

  const { data: partes, error } = await supabase
    .from('partes')
    .select('horas, hora_inicio, hora_fin')
    .eq('tarea_id', tareaId);

  if (error) throw new Error(error.message);

  const totalHoras = (partes ?? []).reduce((acc, p: any) => {
    if (typeof p.horas === 'number' && Number.isFinite(p.horas)) {
      return acc + p.horas;
    }
    const ini = parseTimeToMinutes(p.hora_inicio);
    const fin = parseTimeToMinutes(p.hora_fin);
    if (Number.isFinite(ini) && Number.isFinite(fin) && fin > ini) {
      return acc + (fin - ini) / 60;
    }
    return acc;
  }, 0);

  const { error: up } = await supabase
    .from('tareas')
    .update({ horas_realizadas: totalHoras })
    .eq('id', tareaId);

  if (up) throw new Error(up.message);

  revalidatePath('/tareas');
}

/* Acciones CRUD (opcionales; quedan tipadas y no rompen el build aunque no se usen) */

export async function createTareaAction(fd: FormData) {
  const supabase = createClient();
  const payload = {
    expediente_id: fd.get('expediente_id') ? Number(fd.get('expediente_id')) : null,
    titulo: String(fd.get('titulo') ?? '').trim(),
    horas_previstas: fd.get('horas_previstas') ? Number(fd.get('horas_previstas')) : null,
    horas_realizadas: fd.get('horas_realizadas') ? Number(fd.get('horas_realizadas')) : 0,
    estado: (fd.get('estado') as string) || null,
    prioridad: (fd.get('prioridad') as string) || null,
    vencimiento: (fd.get('vencimiento') as string) || null,
  };

  const { data, error } = await supabase
    .from('tareas')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  if (data?.id) await recomputeTareaHours(Number(data.id));
  revalidatePath('/tareas');
}

export async function updateTareaAction(fd: FormData) {
  const supabase = createClient();
  const id = Number(fd.get('id'));
  if (!Number.isFinite(id)) throw new Error('ID de tarea inválido');

  const patch: Record<string, any> = {
    expediente_id: fd.get('expediente_id') ? Number(fd.get('expediente_id')) : null,
    titulo: String(fd.get('titulo') ?? '').trim(),
    horas_previstas: fd.get('horas_previstas') ? Number(fd.get('horas_previstas')) : null,
    estado: (fd.get('estado') as string) || null,
    prioridad: (fd.get('prioridad') as string) || null,
    vencimiento: (fd.get('vencimiento') as string) || null,
  };

  const { error } = await supabase.from('tareas').update(patch).eq('id', id);
  if (error) throw new Error(error.message);

  await recomputeTareaHours(id);
  revalidatePath('/tareas');
}

export async function deleteTareaAction(id: number) {
  const supabase = createClient();

  const { error } = await supabase.from('tareas').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/tareas');
}
