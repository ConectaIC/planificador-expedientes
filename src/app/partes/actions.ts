// src/app/partes/actions.ts
'use server';

import { createClient } from '@/lib/supabaseServer';
import { revalidatePath } from 'next/cache';

/** Convierte "HH:MM" o "HH:MM:SS" a minutos enteros */
function parseTimeToMinutes(t: unknown): number {
  if (typeof t !== 'string' || !t) return NaN;
  const [hh, mm, ss] = t.split(':').map((x) => Number(x));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return NaN;
  const s = Number.isFinite(ss) ? ss : 0;
  return hh * 60 + mm + s / 60;
}

/**
 * Recalcula y guarda las horas imputadas de un expediente sumando sus partes.
 * - Si la fila de "partes" ya trae `horas` (float8, por trigger), se usa.
 * - Si no, se calcula como (hora_fin - hora_inicio).
 * Devuelve el total en horas.
 */
export async function recomputeExpedienteHours(expedienteId: number) {
  const supabase = createClient();

  const { data: partes, error } = await supabase
    .from('partes')
    .select('horas, hora_inicio, hora_fin')
    .eq('expediente_id', expedienteId);

  if (error) throw new Error(error.message);

  const total = (partes ?? []).reduce((acc, p: any) => {
    if (typeof p.horas === 'number' && Number.isFinite(p.horas)) {
      return acc + p.horas; // preferimos el valor del trigger
    }
    const ini = parseTimeToMinutes(p.hora_inicio);
    const fin = parseTimeToMinutes(p.hora_fin);
    if (Number.isFinite(ini) && Number.isFinite(fin) && fin > ini) {
      return acc + (fin - ini) / 60; // minutos -> horas
    }
    return acc;
  }, 0);

  // Ajusta el nombre de la columna si en tu tabla es distinto (por ejemplo "horas_imputadas")
  const { error: upErr } = await supabase
    .from('expedientes')
    .update({ horas_imputadas: total })
    .eq('id', expedienteId);

  if (upErr) throw new Error(upErr.message);

  revalidatePath('/expedientes');
  revalidatePath('/partes');

  return { ok: true, total };
}
