'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabaseServer';
import { cookies } from 'next/headers';

// Utiliza la misma función de recálculo que en tareas:
async function recalcHorasForTarea(supabase: ReturnType<typeof createClient>, tareaId: number) {
  const { data: partes, error: ePartes } = await supabase
    .from('partes')
    .select('hora_inicio,hora_fin')
    .eq('tarea_id', tareaId);
  if (ePartes) throw new Error(ePartes.message);

  const total = (partes ?? []).reduce((acc, p) => {
const ini = p.hora_inicio
  ? new Date(p.hora_inicio as string | number | Date).getTime()
  : NaN;

const fin = p.hora_fin
  ? new Date(p.hora_fin as string | number | Date).getTime()
  : NaN;

    if (Number.isFinite(ini) && Number.isFinite(fin) && fin > ini) {
      acc += (fin - ini) / 1000 / 3600;
    }
    return acc;
  }, 0);
  const horas = Math.round(total * 100) / 100;

  const { error: eUpdT } = await supabase.from('tareas').update({ horas_realizadas: horas }).eq('id', tareaId);
  if (eUpdT) throw new Error(eUpdT.message);

  // expediente
  const { data: t, error: eT } = await supabase.from('tareas').select('expediente_id').eq('id', tareaId).single();
  if (eT) throw new Error(eT.message);
  const expedienteId = t?.expediente_id as number | null;
  if (!expedienteId) return;

  const { data: tareas, error: eTx } = await supabase
    .from('tareas')
    .select('horas_realizadas')
    .eq('expediente_id', expedienteId);
  if (eTx) throw new Error(eTx.message);

  const sumExp = (tareas ?? []).reduce((acc, x) => acc + (Number(x.horas_realizadas) || 0), 0);
  const sumRound = Math.round(sumExp * 100) / 100;

  const { error: eUpdE } = await supabase.from('expedientes').update({ horas_realizadas: sumRound }).eq('id', expedienteId);
  if (eUpdE) throw new Error(eUpdE.message);
}

export async function createParteAction(fd: FormData) {
  const supabase = createClient();
  const payload = {
    expediente_id: Number(fd.get('expediente_id') ?? 0) || null,
    tarea_id: Number(fd.get('tarea_id') ?? 0) || null,
    fecha: String(fd.get('fecha') ?? '').trim() || null,
    hora_inicio: String(fd.get('hora_inicio') ?? '').trim() || null,
    hora_fin: String(fd.get('hora_fin') ?? '').trim() || null,
    tipo: String(fd.get('tipo') ?? '').trim() || null,
    descripcion: String(fd.get('descripcion') ?? '').trim() || null,
  };
  if (!payload.fecha || !payload.hora_inicio || !payload.hora_fin) {
    throw new Error('Fecha, inicio y fin son obligatorios');
  }

  const { data, error } = await supabase.from('partes').insert(payload).select('id,tarea_id').single();
  if (error) throw new Error(error.message);

  // Recalcular acumulados
  if (data?.tarea_id) {
    await recalcHorasForTarea(supabase, data.tarea_id);
  }

  revalidatePath('/partes');
  revalidatePath('/tareas');
  revalidatePath('/expedientes');
  return data?.id as number | undefined;
}

export async function updateParteAction(fd: FormData) {
  const supabase = createClient();
  const id = Number(fd.get('id') ?? 0);
  if (!id) throw new Error('ID inválido');

  // Obtener tarea_id previo para recalcular luego (por si cambia)
  const { data: previo, error: ePrev } = await supabase.from('partes').select('tarea_id').eq('id', id).single();
  if (ePrev) throw new Error(ePrev.message);
  const tareaAntes = previo?.tarea_id as number | null;

  const patch: Record<string, any> = {
    expediente_id: Number(fd.get('expediente_id') ?? 0) || null,
    tarea_id: Number(fd.get('tarea_id') ?? 0) || null,
    fecha: String(fd.get('fecha') ?? '').trim() || null,
    hora_inicio: String(fd.get('hora_inicio') ?? '').trim() || null,
    hora_fin: String(fd.get('hora_fin') ?? '').trim() || null,
    tipo: String(fd.get('tipo') ?? '').trim() || null,
    descripcion: String(fd.get('descripcion') ?? '').trim() || null,
  };

  const { data: after, error } = await supabase.from('partes').update(patch).eq('id', id).select('tarea_id').single();
  if (error) throw new Error(error.message);

  const tareaDespues = after?.tarea_id as number | null;
  const toRecalc = new Set<number>();
  if (tareaAntes) toRecalc.add(tareaAntes);
  if (tareaDespues) toRecalc.add(tareaDespues);
  for (const t of toRecalc) await recalcHorasForTarea(supabase, t);

  revalidatePath('/partes');
  revalidatePath('/tareas');
  revalidatePath('/expedientes');
}

export async function deleteParteAction(fd: FormData) {
  const supabase = createClient();
  const id = Number(fd.get('id') ?? 0);
  if (!id) throw new Error('ID inválido');

  const { data: previo, error: ePrev } = await supabase.from('partes').select('tarea_id').eq('id', id).single();
  if (ePrev) throw new Error(ePrev.message);
  const tareaId = previo?.tarea_id as number | null;

  const { error } = await supabase.from('partes').delete().eq('id', id);
  if (error) throw new Error(error.message);

  if (tareaId) await recalcHorasForTarea(supabase, tareaId);

  revalidatePath('/partes');
  revalidatePath('/tareas');
  revalidatePath('/expedientes');
}
