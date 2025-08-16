// src/app/partes/actions.ts
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

/** Suma horas de todas las partes de una tarea y actualiza tareas.horas_realizadas */
async function recalcHorasForTarea(tareaId: number) {
  if (!Number.isFinite(tareaId)) return;
  const supabase = createClient();

  const { data: partes, error } = await supabase
    .from('partes')
    .select('horas, hora_inicio, hora_fin')
    .eq('tarea_id', tareaId);

  if (error) throw new Error(error.message);

  const total = (partes ?? []).reduce((acc, p: any) => {
    if (typeof p.horas === 'number' && Number.isFinite(p.horas)) {
      return acc + p.horas; // preferimos el valor del trigger si existe
    }
    const ini = parseTimeToMinutes(p.hora_inicio);
    const fin = parseTimeToMinutes(p.hora_fin);
    if (Number.isFinite(ini) && Number.isFinite(fin) && fin > ini) {
      return acc + (fin - ini) / 60; // minutos -> horas
    }
    return acc;
  }, 0);

  const { error: up } = await supabase
    .from('tareas')
    .update({ horas_realizadas: total })
    .eq('id', tareaId);

  if (up) throw new Error(up.message);
}

/** Suma horas de todas las partes de un expediente y actualiza expedientes.horas_imputadas */
async function recalcHorasForExpediente(expedienteId: number) {
  if (!Number.isFinite(expedienteId)) return;
  const supabase = createClient();

  const { data: partes, error } = await supabase
    .from('partes')
    .select('horas, hora_inicio, hora_fin')
    .eq('expediente_id', expedienteId);

  if (error) throw new Error(error.message);

  const total = (partes ?? []).reduce((acc, p: any) => {
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

  // ATENCIÓN: si tu columna no se llama "horas_imputadas", dime el nombre exacto y te lo cambio
  const { error: up } = await supabase
    .from('expedientes')
    .update({ horas_imputadas: total })
    .eq('id', expedienteId);

  if (up) throw new Error(up.message);
}

/* =====================  ACCIONES CRUD  ===================== */

export async function createParteAction(fd: FormData) {
  const supabase = createClient();

  const payload = {
    expediente_id: fd.get('expediente_id') ? Number(fd.get('expediente_id')) : null,
    tarea_id: fd.get('tarea_id') ? Number(fd.get('tarea_id')) : null,
    fecha: (fd.get('fecha') as string) || null,
    hora_inicio: (fd.get('hora_inicio') as string) || null,
    hora_fin: (fd.get('hora_fin') as string) || null,
    horas: fd.get('horas') ? Number(fd.get('horas')) : null, // si usas trigger, esto puede ir null
    comentario: (fd.get('comentario') as string) || null,
  };

  const { data, error } = await supabase
    .from('partes')
    .insert(payload)
    .select('id, expediente_id, tarea_id')
    .single();

  if (error) throw new Error(error.message);

  // Recalcular acumulados de forma segura con cast numérico
  const tareaId = Number(data?.tarea_id);
  if (Number.isFinite(tareaId)) await recalcHorasForTarea(tareaId);

  const expedienteId = Number(data?.expediente_id);
  if (Number.isFinite(expedienteId)) await recalcHorasForExpediente(expedienteId);

  revalidatePath('/partes');
  revalidatePath('/tareas');
  revalidatePath('/expedientes');
}

export async function updateParteAction(fd: FormData) {
  const supabase = createClient();

  const id = Number(fd.get('id'));
  if (!Number.isFinite(id)) throw new Error('ID de parte inválido');

  const patch: Record<string, any> = {
    expediente_id: fd.get('expediente_id') ? Number(fd.get('expediente_id')) : null,
    tarea_id: fd.get('tarea_id') ? Number(fd.get('tarea_id')) : null,
    fecha: (fd.get('fecha') as string) || null,
    hora_inicio: (fd.get('hora_inicio') as string) || null,
    hora_fin: (fd.get('hora_fin') as string) || null,
    horas: fd.get('horas') ? Number(fd.get('horas')) : null,
    comentario: (fd.get('comentario') as string) || null,
  };

  // Necesitamos los antiguos valores para saber qué recalcular si cambian las relaciones
  const { data: prev } = await supabase
    .from('partes')
    .select('expediente_id, tarea_id')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('partes')
    .update(patch)
    .eq('id', id)
    .select('expediente_id, tarea_id')
    .single();

  if (error) throw new Error(error.message);

  const idsTarea = [
    Number(prev?.tarea_id),
    Number(data?.tarea_id),
  ].filter((x) => Number.isFinite(x)) as number[];

  const idsExp = [
    Number(prev?.expediente_id),
    Number(data?.expediente_id),
  ].filter((x) => Number.isFinite(x)) as number[];

  for (const t of Array.from(new Set(idsTarea))) await recalcHorasForTarea(t);
  for (const e of Array.from(new Set(idsExp))) await recalcHorasForExpediente(e);

  revalidatePath('/partes');
  revalidatePath('/tareas');
  revalidatePath('/expedientes');
}

export async function deleteParteAction(id: number) {
  const supabase = createClient();

  // Leer relaciones antes de borrar
  const { data: prev } = await supabase
    .from('partes')
    .select('expediente_id, tarea_id')
    .eq('id', id)
    .single();

  const { error } = await supabase.from('partes').delete().eq('id', id);
  if (error) throw new Error(error.message);

  const tareaId = Number(prev?.tarea_id);
  if (Number.isFinite(tareaId)) await recalcHorasForTarea(tareaId);

  const expedienteId = Number(prev?.expediente_id);
  if (Number.isFinite(expedienteId)) await recalcHorasForExpediente(expedienteId);

  revalidatePath('/partes');
  revalidatePath('/tareas');
  revalidatePath('/expedientes');
}
