// src/app/tareas/actions.ts
'use server';

import { supabaseAdmin } from '../../lib/supabaseAdmin';

/**
 * Campos mínimos que manejamos:
 * - titulo* (string)
 * - expediente_id* (number)
 * - descripcion (string | null)
 * - vencimiento (YYYY-MM-DD | null)
 * - horas_previstas (number | null)
 * - estado (string | null)  // 'pendiente' | 'en curso' | 'completada' (libre)
 * - tipo (string | null)    // 'productiva' | 'no productiva' (libre)
 */

export async function createTarea(formData: FormData) {
  const titulo = String(formData.get('titulo') || '').trim();
  const expediente_id = Number(formData.get('expediente_id') || 0);
  if (!titulo || !expediente_id) return { ok: false, error: 'Título y Expediente son obligatorios' };

  const payload = {
    titulo,
    expediente_id,
    descripcion: (String(formData.get('descripcion') || '').trim() || null),
    vencimiento: String(formData.get('vencimiento') || '').slice(0, 10) || null,
    horas_previstas: Number(formData.get('horas_previstas') || 0) || null,
    estado: (String(formData.get('estado') || '').trim() || null),
    tipo: (String(formData.get('tipo') || '').trim() || null),
  };

  const sb = supabaseAdmin();
  const { error } = await sb.from('tareas').insert(payload);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateTarea(formData: FormData) {
  const id = Number(formData.get('id') || 0);
  if (!id) return { ok: false, error: 'Falta ID de tarea' };

  const payload: any = {
    titulo: (String(formData.get('titulo') || '').trim() || null),
    expediente_id: Number(formData.get('expediente_id') || 0) || null,
    descripcion: (String(formData.get('descripcion') || '').trim() || null),
    vencimiento: String(formData.get('vencimiento') || '').slice(0, 10) || null,
    horas_previstas: Number(formData.get('horas_previstas') || 0) || null,
    estado: (String(formData.get('estado') || '').trim() || null),
    tipo: (String(formData.get('tipo') || '').trim() || null),
  };

  const sb = supabaseAdmin();
  const { error } = await sb.from('tareas').update(payload).eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteTarea(id: number) {
  if (!id) return { ok: false, error: 'Falta ID de tarea' };
  const sb = supabaseAdmin();
  const { error } = await sb.from('tareas').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
