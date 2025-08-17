'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabaseServer';

/* ----------------- Tipos ----------------- */
type NewTareaInput = {
  expediente_id: number;
  titulo: string;
  horas_previstas?: number | null;
  prioridad?: string | null;
  vencimiento?: string | null;   // YYYY-MM-DD
  estado?: string | null;
  descripcion?: string | null;
};
type UpdateTareaInput = NewTareaInput & { id: number };

/* ----------------- Utils ----------------- */
function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = (v ?? '').toString().trim();
  return s === '' ? null : s;
}
function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = (v ?? '').toString().trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function fdToNewTarea(fd: FormData): NewTareaInput {
  return {
    expediente_id: Number(fd.get('expediente_id') ?? 0),
    titulo: (fd.get('titulo') ?? '').toString(),
    horas_previstas: numOrNull(fd.get('horas_previstas')),
    prioridad: strOrNull(fd.get('prioridad')),
    vencimiento: strOrNull(fd.get('vencimiento')),
    estado: strOrNull(fd.get('estado')) ?? 'pendiente',
    descripcion: strOrNull(fd.get('descripcion')),
  };
}
function fdToUpdateTarea(fd: FormData): UpdateTareaInput {
  return {
    id: Number(fd.get('id') ?? 0),
    ...fdToNewTarea(fd),
  };
}

/* -------- Recalcular acumulados (tarea + expediente) -------- */
async function recalcHorasForTarea(
  supabase: ReturnType<typeof createClient>,
  tareaId: number
) {
  const { data: partes } = await supabase
    .from('partes')
    .select('hora_inicio,hora_fin')
    .eq('tarea_id', tareaId);

  let totalHoras = 0;
  for (const p of partes ?? []) {
    const ini = p?.hora_inicio ? new Date(p.hora_inicio as any).getTime() : NaN;
    const fin = p?.hora_fin ? new Date(p.hora_fin as any).getTime() : NaN;
    if (Number.isFinite(ini) && Number.isFinite(fin) && fin > ini) {
      totalHoras += (fin - ini) / 1000 / 3600;
    }
  }
  await supabase.from('tareas').update({ horas_realizadas: totalHoras }).eq('id', tareaId);

  const { data: tareaRow } = await supabase
    .from('tareas')
    .select('expediente_id')
    .eq('id', tareaId)
    .single();

  const expedienteId = tareaRow?.expediente_id as number | undefined;
  if (expedienteId) {
    const { data: tareasExp } = await supabase
      .from('tareas')
      .select('horas_realizadas')
      .eq('expediente_id', expedienteId);

    const sumExp = (tareasExp ?? []).reduce(
      (acc: number, t: any) => acc + (Number(t?.horas_realizadas ?? 0) || 0),
      0
    );
    await supabase.from('expedientes').update({ horas_realizadas: sumExp }).eq('id', expedienteId);
  }
}

/* ----------------- Acciones CRUD ----------------- */
export async function createTarea(input: NewTareaInput | FormData) {
  const supabase = createClient();
  const payload: NewTareaInput = input instanceof FormData ? fdToNewTarea(input) : input;

  const { data, error } = await supabase
    .from('tareas')
    .insert({
      expediente_id: payload.expediente_id,
      titulo: payload.titulo,
      horas_previstas: payload.horas_previstas ?? null,
      prioridad: payload.prioridad ?? null,
      vencimiento: payload.vencimiento ?? null,
      estado: payload.estado ?? 'pendiente',
      descripcion: payload.descripcion ?? null,
    })
    .select('id')
    .single();

  if (error) {
    const message = error.message ?? 'Error al crear tarea';
    return { ok: false as const, id: null, message, error: message };
  }

  const id = Number(data.id);
  await recalcHorasForTarea(supabase, id);

  revalidatePath('/tareas');
  revalidatePath('/expedientes');
  revalidatePath('/partes');

  return { ok: true as const, id, message: null, error: null };
}

export async function updateTarea(input: UpdateTareaInput | FormData) {
  const supabase = createClient();
  const payload: UpdateTareaInput =
    input instanceof FormData ? fdToUpdateTarea(input) : input;

  const { error } = await supabase
    .from('tareas')
    .update({
      expediente_id: payload.expediente_id,
      titulo: payload.titulo,
      horas_previstas: payload.horas_previstas ?? null,
      prioridad: payload.prioridad ?? null,
      vencimiento: payload.vencimiento ?? null,
      estado: payload.estado ?? null,
      descripcion: payload.descripcion ?? null,
    })
    .eq('id', payload.id);

  if (error) {
    const message = error.message ?? 'Error al actualizar tarea';
    return { ok: false as const, id: payload.id, message, error: message };
  }

  await recalcHorasForTarea(supabase, Number(payload.id));

  revalidatePath('/tareas');
  revalidatePath('/expedientes');
  revalidatePath('/partes');

  return { ok: true as const, id: Number(payload.id), message: null, error: null };
}

export async function deleteTarea(input: number | FormData) {
  const supabase = createClient();
  const id = input instanceof FormData ? Number(input.get('id') ?? 0) : Number(input);
  if (!Number.isFinite(id) || id <= 0) {
    return { ok: false as const, id: null, message: 'ID inválido', error: 'ID inválido' };
  }

  const { data: tareaRow } = await supabase
    .from('tareas')
    .select('id,expediente_id')
    .eq('id', id)
    .single();

  const expedienteId = tareaRow?.expediente_id as number | undefined;

  await supabase.from('partes').delete().eq('tarea_id', id);
  const { error } = await supabase.from('tareas').delete().eq('id', id);
  if (error) {
    const message = error.message ?? 'Error al borrar tarea';
    return { ok: false as const, id, message, error: message };
  }

  if (expedienteId) {
    const { data: tareasExp } = await supabase
      .from('tareas')
      .select('horas_realizadas')
      .eq('expediente_id', expedienteId);

    const sumExp = (tareasExp ?? []).reduce(
      (acc: number, t: any) => acc + (Number(t?.horas_realizadas ?? 0) || 0),
      0
    );
    await supabase.from('expedientes').update({ horas_realizadas: sumExp }).eq('id', expedienteId);
  }

  revalidatePath('/tareas');
  revalidatePath('/expedientes');
  revalidatePath('/partes');

  return { ok: true as const, id, message: null, error: null };
}

/* -------- Aliases de compatibilidad con imports existentes -------- */
export const createTareaAction = createTarea;
export const updateTareaAction = updateTarea;
export const deleteTareaAction = deleteTarea;
