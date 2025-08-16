'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabaseServer';

// ---------- Tipos auxiliares ----------
function toStr(v: FormDataEntryValue | null): string | null {
  const s = (v ?? '').toString().trim();
  return s.length ? s : null;
}
function toNum(v: FormDataEntryValue | null): number | null {
  const s = (v ?? '').toString().trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function toDateStr(v: FormDataEntryValue | null): string | null {
  const s = (v ?? '').toString().trim();
  return s.length ? s : null; // esperamos 'YYYY-MM-DD'
}

// ========== EXPEDIENTES ==========

// Crear expediente
export async function createExpedienteAction(fd: FormData) {
  const supabase = createClient(); // ✅ sin cookies()

  const payload = {
    codigo: String(fd.get('codigo') || '').trim(),
    proyecto: String(fd.get('proyecto') || '').trim(),
    cliente: toStr(fd.get('cliente')),
    inicio: toDateStr(fd.get('inicio')),
    fin: toDateStr(fd.get('fin')),
    prioridad: toStr(fd.get('prioridad')) as 'Baja' | 'Media' | 'Alta' | null,
    estado: toStr(fd.get('estado')) as 'Pendiente' | 'En curso' | 'En supervisión' | 'Entregado' | 'Cerrado' | null,
    horas_previstas: toNum(fd.get('horas_previstas')),
    horas_reales: toNum(fd.get('horas_reales')),
  };

  const { error } = await supabase.from('expedientes').insert(payload);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/expedientes');
  return { ok: true };
}

// Actualizar expediente
export async function updateExpedienteAction(id: number, fd: FormData) {
  const supabase = createClient();

  const payload = {
    codigo: String(fd.get('codigo') || '').trim(),
    proyecto: String(fd.get('proyecto') || '').trim(),
    cliente: toStr(fd.get('cliente')),
    inicio: toDateStr(fd.get('inicio')),
    fin: toDateStr(fd.get('fin')),
    prioridad: toStr(fd.get('prioridad')) as 'Baja' | 'Media' | 'Alta' | null,
    estado: toStr(fd.get('estado')) as 'Pendiente' | 'En curso' | 'En supervisión' | 'Entregado' | 'Cerrado' | null,
    horas_previstas: toNum(fd.get('horas_previstas')),
    horas_reales: toNum(fd.get('horas_reales')),
  };

  const { error } = await supabase.from('expedientes').update(payload).eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/expedientes');
  revalidatePath(`/expedientes/${encodeURIComponent(String(fd.get('codigo') || ''))}`);
  return { ok: true };
}

// Borrar expediente
export async function deleteExpedienteAction(id: number) {
  const supabase = createClient();

  const { error } = await supabase.from('expedientes').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/expedientes');
  return { ok: true };
}

// ========== TAREAS (vinculadas a expediente) ==========

// Crear tarea
export async function createTaskAction(expedienteId: number, fd: FormData) {
  const supabase = createClient();

  const payload = {
    expediente_id: expedienteId,
    titulo: String(fd.get('titulo') || '').trim(),
    horas_previstas: toNum(fd.get('horas_previstas')),
    horas_realizadas: toNum(fd.get('horas_realizadas')),
    estado: toStr(fd.get('estado')) as 'Pendiente' | 'En curso' | 'Completada' | null,
    prioridad: toStr(fd.get('prioridad')) as 'Baja' | 'Media' | 'Alta' | null,
    vencimiento: toDateStr(fd.get('vencimiento')),
  };

  const { error } = await supabase.from('tareas').insert(payload);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/expedientes/${encodeURIComponent(String(fd.get('expediente_codigo') || ''))}`);
  revalidatePath('/tareas');
  return { ok: true };
}

// Actualizar tarea
export async function updateTaskAction(id: number, fd: FormData) {
  const supabase = createClient();

  const payload = {
    titulo: String(fd.get('titulo') || '').trim(),
    horas_previstas: toNum(fd.get('horas_previstas')),
    horas_realizadas: toNum(fd.get('horas_realizadas')),
    estado: toStr(fd.get('estado')) as 'Pendiente' | 'En curso' | 'Completada' | null,
    prioridad: toStr(fd.get('prioridad')) as 'Baja' | 'Media' | 'Alta' | null,
    vencimiento: toDateStr(fd.get('vencimiento')),
  };

  const { error } = await supabase.from('tareas').update(payload).eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/tareas');
  return { ok: true };
}

// Borrar tarea
export async function deleteTaskAction(id: number) {
  const supabase = createClient();

  const { error } = await supabase.from('tareas').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/tareas');
  return { ok: true };
}
