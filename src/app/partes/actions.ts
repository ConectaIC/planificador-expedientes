// src/app/partes/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabaseServer';

type InsertParte = {
  fecha: string;                      // 'YYYY-MM-DD'
  hora_inicio?: string | null;        // 'HH:MM' o ISO, según envíe tu form
  hora_fin?: string | null;           // 'HH:MM' o ISO, según envíe tu form
  expediente_id?: number | null;
  tarea_id?: number | null;
  descripcion?: string | null;
  comentario?: string | null;
};

/**
 * Recalcula horas_realizadas de una tarea sumando la duración de sus partes.
 * Mantén la firma exacta (supabase:any, tareaId:number) para evitar el error de '{}' -> number.
 */
export async function recalcHorasForTarea(supabase: any, tareaId: number) {
  const { data: partes, error } = await supabase
    .from('partes')
    .select('hora_inicio,hora_fin')
    .eq('tarea_id', tareaId);

  if (error) throw new Error(error.message);

  let total = 0;
  for (const p of partes ?? []) {
    // Convertimos de forma segura a Date (acepta ISO o 'YYYY-MM-DDTHH:mm')
    const ini = p.hora_inicio ? new Date(p.hora_inicio as any).getTime() : NaN;
    const fin = p.hora_fin ? new Date(p.hora_fin as any).getTime() : NaN;
    if (Number.isFinite(ini) && Number.isFinite(fin) && fin > ini) {
      total += (fin - ini) / 1000 / 3600;
    }
  }

  const { error: upErr } = await supabase
    .from('tareas')
    .update({ horas_realizadas: total })
    .eq('id', tareaId);

  if (upErr) throw new Error(upErr.message);
}

/**
 * Server Action para crear un parte desde un <form action={createParte}> en componentes cliente.
 * Lee los campos desde FormData, inserta y revalida la página de partes.
 */
export async function createParteAction(fd: FormData) {
  const supabase = createClient();

  const payload: InsertParte = {
    fecha: String(fd.get('fecha') || '').slice(0, 10),
    hora_inicio: (fd.get('hora_inicio') as string) || null,
    hora_fin: (fd.get('hora_fin') as string) || null,
    expediente_id: fd.get('expediente_id') ? Number(fd.get('expediente_id')) : null,
    tarea_id: fd.get('tarea_id') ? Number(fd.get('tarea_id')) : null,
    descripcion: (fd.get('descripcion') as string) || null,
    comentario: (fd.get('comentario') as string) || null,
  };

  const { data, error } = await supabase
    .from('partes')
    .insert(payload)
    .select('id, tarea_id')
    .single();

  if (error) throw new Error(error.message);

  // Recalcula acumulados si el parte está vinculado a una tarea
  if (data?.tarea_id != null) {
    await recalcHorasForTarea(supabase, Number(data.tarea_id));
  }

  // Revalida lista
  revalidatePath('/partes');

  return { ok: true, id: data?.id ?? null };
}

/**
 * 🔗 Alias para mantener compatibilidad con tu import en ParteForm:
 *   import { createParte } from '../app/partes/actions'
 */
export { createParteAction as createParte };
