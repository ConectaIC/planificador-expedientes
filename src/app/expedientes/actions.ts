// src/app/expedientes/actions.ts
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabaseServer';

// 🟢 Crear tarea
export async function createTaskAction(fd: FormData) {
  const supabase = createClient(cookies());

  const expediente_id = Number(fd.get('expediente_id'));
  const expediente_codigo = String(fd.get('expediente_codigo') || '');
  const payload = {
    expediente_id,
    titulo: String(fd.get('titulo') || '').trim(),
    horas_previstas: Number(fd.get('horas_previstas') || 0) || null,
    estado: (String(fd.get('estado') || '') || null) as any,
    prioridad: (String(fd.get('prioridad') || '') || null) as any,
    vencimiento: String(fd.get('vencimiento') || '') || null,
  };

  const { error } = await supabase.from('tareas').insert(payload);
  if (error) throw new Error(`No se pudo crear la tarea: ${error.message}`);

  revalidatePath('/expedientes');
  if (expediente_codigo) {
    revalidatePath(`/expedientes/${encodeURIComponent(expediente_codigo)}`);
  }
}

// ✏️ Actualizar tarea
export async function updateTaskAction(fd: FormData) {
  const supabase = createClient(cookies());
  const id = Number(fd.get('id'));
  const expediente_codigo = String(fd.get('expediente_codigo') || '');

  const payload: Record<string, any> = {
    titulo: String(fd.get('titulo') || '').trim(),
    horas_previstas: Number(fd.get('horas_previstas') || 0) || null,
    estado: String(fd.get('estado') || '') || null,
    prioridad: String(fd.get('prioridad') || '') || null,
    vencimiento: String(fd.get('vencimiento') || '') || null,
  };

  const { error } = await supabase.from('tareas').update(payload).eq('id', id);
  if (error) throw new Error(`No se pudo actualizar la tarea: ${error.message}`);

  revalidatePath('/expedientes');
  if (expediente_codigo) {
    revalidatePath(`/expedientes/${encodeURIComponent(expediente_codigo)}`);
  }
}

// 🗑️ Borrar tarea
export async function deleteTaskAction(fd: FormData) {
  const supabase = createClient(cookies());
  const id = Number(fd.get('id'));
  const expediente_codigo = String(fd.get('expediente_codigo') || '');

  const { error } = await supabase.from('tareas').delete().eq('id', id);
  if (error) throw new Error(`No se pudo borrar la tarea: ${error.message}`);

  revalidatePath('/expedientes');
  if (expediente_codigo) {
    revalidatePath(`/expedientes/${encodeURIComponent(expediente_codigo)}`);
  }
}
