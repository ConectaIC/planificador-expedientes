'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabaseServer';

/** Recalcula horas_realizadas de la tarea y del expediente al que pertenece */
async function recalcHorasForTarea(supabase: ReturnType<typeof createClient>, tareaId: number) {
  // 1) horas realizadas de la tarea = suma de partes (hora_fin - hora_inicio)
  const { data: partes, error: ePartes } = await supabase
    .from('partes')
    .select('hora_inicio,hora_fin')
    .eq('tarea_id', tareaId);

  if (ePartes) throw new Error(`Error leyendo partes: ${ePartes.message}`);

  const totalHoras = (partes ?? []).reduce((acc, p) => {
    const ini = p.hora_inicio ? new Date(p.hora_inicio).getTime() : NaN;
    const fin = p.hora_fin ? new Date(p.hora_fin).getTime() : NaN;
    if (Number.isFinite(ini) && Number.isFinite(fin) && fin > ini) {
      acc += (fin - ini) / 1000 / 3600;
    }
    return acc;
  }, 0);

  const redondeo = Math.round(totalHoras * 100) / 100;

  // 2) actualizar tarea
  {
    const { error } = await supabase
      .from('tareas')
      .update({ horas_realizadas: redondeo })
      .eq('id', tareaId);
    if (error) throw new Error(`No se pudo actualizar horas de la tarea: ${error.message}`);
  }

  // 3) buscar expediente_id de la tarea
  const { data: tarea, error: eT } = await supabase
    .from('tareas')
    .select('expediente_id')
    .eq('id', tareaId)
    .single();

  if (eT) throw new Error(`No se pudo obtener la tarea: ${eT.message}`);
  const expedienteId = tarea?.expediente_id as number | null;
  if (!expedienteId) return;

  // 4) horas del expediente = suma horas_realizadas de sus tareas
  const { data: tareasDelExp, error: eTx } = await supabase
    .from('tareas')
    .select('horas_realizadas')
    .eq('expediente_id', expedienteId);

  if (eTx) throw new Error(`Error sumando tareas del expediente: ${eTx.message}`);

  const totalExp = (tareasDelExp ?? []).reduce((acc, t) => acc + (Number(t.horas_realizadas) || 0), 0);
  const totalExpRound = Math.round(totalExp * 100) / 100;

  const { error: eUpd } = await supabase
    .from('expedientes')
    .update({ horas_realizadas: totalExpRound })
    .eq('id', expedienteId);

  if (eUpd) throw new Error(`No se pudo actualizar horas del expediente: ${eUpd.message}`);
}

export async function createTareaAction(fd: FormData) {
  const supabase = createClient();
  const payload = {
    expediente_id: Number(fd.get('expediente_id') ?? 0) || null,
    titulo: String(fd.get('titulo') ?? '').trim(),
    vencimiento: String(fd.get('vencimiento') ?? '').trim() || null,
    prioridad: String(fd.get('prioridad') ?? '').trim() || null,
    estado: String(fd.get('estado') ?? '').trim() || null,
    horas_previstas: Number(fd.get('horas_previstas') ?? 0) || 0,
    tipo: String(fd.get('tipo') ?? '').trim() || null,
    descripcion: String(fd.get('descripcion') ?? '').trim() || null,
  };
  if (!payload.titulo) throw new Error('El título es obligatorio');

  const { data, error } = await supabase.from('tareas').insert(payload).select('id').single();
  if (error) throw new Error(error.message);

  // Al crear no hay horas realizadas todavía, pero revalidamos listado
  revalidatePath('/tareas');
  if (payload.expediente_id) revalidatePath('/expedientes');
  return data?.id as number | undefined;
}

export async function updateTareaAction(fd: FormData) {
  const supabase = createClient();
  const id = Number(fd.get('id') ?? 0);
  if (!id) throw new Error('ID de tarea inválido');

  const patch: Record<string, any> = {
    titulo: String(fd.get('titulo') ?? '').trim() || undefined,
    vencimiento: String(fd.get('vencimiento') ?? '').trim() || null,
    prioridad: String(fd.get('prioridad') ?? '').trim() || null,
    estado: String(fd.get('estado') ?? '').trim() || null,
    horas_previstas: Number(fd.get('horas_previstas') ?? '') || 0,
    tipo: String(fd.get('tipo') ?? '').trim() || null,
    descripcion: String(fd.get('descripcion') ?? '').trim() || null,
    expediente_id: Number(fd.get('expediente_id') ?? 0) || null,
  };

  const { error } = await supabase.from('tareas').update(patch).eq('id', id);
  if (error) throw new Error(error.message);

  // Si cambió de expediente, el recálculo lo dispara la edición de partes.
  revalidatePath('/tareas');
  revalidatePath('/expedientes');
}

export async function deleteTareaAction(fd: FormData) {
  const supabase = createClient();
  const id = Number(fd.get('id') ?? 0);
  if (!id) throw new Error('ID inválido');

  // Guardamos expediente_id para revalidad después
  const { data: t, error: eT } = await supabase.from('tareas').select('expediente_id').eq('id', id).single();
  if (eT) throw new Error(eT.message);
  const expedienteId = t?.expediente_id as number | null;

  const { error } = await supabase.from('tareas').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/tareas');
  if (expedienteId) revalidatePath('/expedientes');
}

/** Recalcular horas a mano si lo necesitas desde UI (no es obligatorio exponerlo) */
export async function recalcTareaHorasAction(tareaId: number) {
  const supabase = createClient();
  await recalcHorasForTarea(supabase, tareaId);
  revalidatePath('/tareas');
  revalidatePath('/expedientes');
}
