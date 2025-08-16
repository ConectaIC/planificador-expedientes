// src/app/expedientes/actions.ts
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabaseServer';

/* =========================================================
 * EXPEDIENTES
 * =======================================================*/

// Crear expediente
export async function createExpedienteAction(fd: FormData) {
  const supabase = createClient(cookies());

  const payload = {
    codigo: String(fd.get('codigo') || '').trim(),
    proyecto: String(fd.get('proyecto') || '').trim(),
    cliente: String(fd.get('cliente') || '').trim() || null,
    inicio: String(fd.get('inicio') || '') || null,
    fin: String(fd.get('fin') || '') || null,
    prioridad: (String(fd.get('prioridad') || '') || null) as 'Baja' | 'Media' | 'Alta' | null,
    estado: (String(fd.get('estado') || '') || null) as
      | 'Pendiente'
      | 'En curso'
      | 'En supervisión'
      | 'Entregado'
      | 'Cerrado'
      | null,
  };

  const { error } = await supabase.from('expedientes').insert(payload);
  if (error) throw new Error(`No se pudo crear el expediente: ${error.message}`);

  revalidatePath('/expedientes');
}

// Actualizar expediente
export async function updateExpedienteAction(fd: FormData) {
  const supabase = createClient(cookies());
  const id = Number(fd.get('id'));

  const payload: Record<string, any> = {
    codigo: String(fd.get('codigo') || '').trim(),
    proyecto: String(fd.get('proyecto') || '').trim(),
    cliente: String(fd.get('cliente') || '').trim() || null,
    inicio: String(fd.get('inicio') || '') || null,
    fin: String(fd.get('fin') || '') || null,
    prioridad: String(fd.get('prioridad') || '') || null,
    estado: String(fd.get('estado') || '') || null,
  };

  const { error } = await supabase.from('expedientes').update(payload).eq('id', id);
  if (error) throw new Error(`No se pudo actualizar el expediente: ${error.message}`);

  revalidatePath('/expedientes');
}

// Borrar expediente
export async function deleteExpedienteAction(fd: FormData) {
  const supabase = createClient(cookies());
  const id = Number(fd.get('id'));

  const { error } = await supabase.from('expedientes').delete().eq('id', id);
  if (error) throw new Error(`No se pudo borrar el expediente: ${error.message}`);

  revalidatePath('/expedientes');
}

/* =========================================================
 * TAREAS (se mantienen aquí si ya las usas desde la página
 *         de detalle del expediente)
 * =======================================================*/

// Crear tarea
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

// Actualizar tarea
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

// Borrar tarea
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
