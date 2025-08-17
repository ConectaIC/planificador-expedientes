'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabaseServer';

/* ----------------- Tipos de entrada (flexibles) ----------------- */
type NewTareaInput = {
  expediente_id: number;
  titulo: string;
  horas_previstas?: number | null;
  prioridad?: string | null;          // p.ej. 'baja' | 'media' | 'alta'
  vencimiento?: string | null;        // ISO date (YYYY-MM-DD)
  estado?: string | null;             // p.ej. 'pendiente' | 'en_progreso' | 'hecha'
  descripcion?: string | null;
};

type UpdateTareaInput = NewTareaInput & { id: number };

/* ----------------- Helpers ----------------- */
async function recalcHorasForTarea(supabase: ReturnType<typeof createClient>, tareaId: number) {
  // 1) Sumar horas de partes vinculados a la tarea
  const { data: partes, error: ePartes } = await supabase
    .from('partes')
    .select('hora_inicio,hora_fin')
    .eq('tarea_id', tareaId);

  if (ePartes) {
    // No lanzamos excepción; devolvemos y dejamos el valor como está
    return;
  }

  let totalHoras = 0;
  for (const p of partes ?? []) {
    const ini = p?.hora_inicio ? new Date(p.hora_inicio as any).getTime() : NaN;
    const fin = p?.hora_fin ? new Date(p.hora_fin as any).getTime() : NaN;
    if (Number.isFinite(ini) && Number.isFinite(fin) && fin > ini) {
      totalHoras += (fin - ini) / 1000 / 3600;
    }
  }

  await supabase.from('tareas').update({ horas_realizadas: totalHoras }).eq('id', tareaId);

  // 2) Actualizar acumulado del expediente al que pertenece la tarea
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
      (acc, t: any) => acc + (Number(t?.horas_realizadas ?? 0) || 0),
      0
    );

    await supabase.from('expedientes').update({ horas_realizadas: sumExp }).eq('id', expedienteId);
  }
}

/* ----------------- Acciones (lo que usa TareaForm) ----------------- */
export async function createTarea(input: NewTareaInput) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tareas')
    .insert({
      expediente_id: input.expediente_id,
      titulo: input.titulo,
      horas_previstas: input.horas_previstas ?? null,
      prioridad: input.prioridad ?? null,
      vencimiento: input.vencimiento ?? null,
      estado: input.estado ?? 'pendiente',
      descripcion: input.descripcion ?? null,
    })
    .select('id')
    .single();

  if (error) {
    const message = error.message ?? 'Error al crear tarea';
    return { ok: false as const, id: null, message, error: message };
  }

  await recalcHorasForTarea(supabase, Number(data.id));

  // Revalidar páginas relacionadas
  revalidatePath('/tareas');
  revalidatePath('/expedientes');
  revalidatePath('/partes');

  return { ok: true as const, id: Number(data.id), message: null, error: null };
}

export async function updateTarea(input: UpdateTareaInput) {
  const supabase = createClient();

  const { error } = await supabase
    .from('tareas')
    .update({
      expediente_id: input.expediente_id,
      titulo: input.titulo,
      horas_previstas: input.horas_previstas ?? null,
      prioridad: input.prioridad ?? null,
      vencimiento: input.vencimiento ?? null,
      estado: input.estado ?? null,
      descripcion: input.descripcion ?? null,
    })
    .eq('id', input.id);

  if (error) {
    const message = error.message ?? 'Error al actualizar tarea';
    return { ok: false as const, id: input.id, message, error: message };
  }

  await recalcHorasForTarea(supabase, Number(input.id));

  // Revalidar páginas relacionadas
  revalidatePath('/tareas');
  revalidatePath('/expedientes');
  revalidatePath('/partes');

  return { ok: true as const, id: Number(input.id), message: null, error: null };
}

/* (Opcional) Si en algún sitio usas estos nombres, también los exponemos: */
export { createTarea as createTareaAction, updateTarea as updateTareaAction };
