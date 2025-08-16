// src/app/expedientes/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabaseServer';

export async function createExpedienteAction(fd: FormData) {
  const supabase = createClient();

  const payload = {
    codigo: String(fd.get('codigo') ?? '').trim(),
    proyecto: String(fd.get('proyecto') ?? '').trim() || null,
    cliente: String(fd.get('cliente') ?? '').trim() || null,
    fin: (fd.get('fin') as string) || null,
    prioridad: (fd.get('prioridad') as string) || null,
    estado: (fd.get('estado') as string) || null,
  };

  const { error } = await supabase.from('expedientes').insert(payload);
  if (error) throw new Error(error.message);

  revalidatePath('/expedientes');
}

export async function updateExpedienteAction(fd: FormData) {
  const supabase = createClient();

  const id = Number(fd.get('id'));
  if (!id) throw new Error('ID inválido');

  const patch: Record<string, any> = {
    codigo: String(fd.get('codigo') ?? '').trim(),
    proyecto: String(fd.get('proyecto') ?? '').trim() || null,
    cliente: String(fd.get('cliente') ?? '').trim() || null,
    fin: (fd.get('fin') as string) || null,
    prioridad: (fd.get('prioridad') as string) || null,
    estado: (fd.get('estado') as string) || null,
  };

  const { error } = await supabase.from('expedientes').update(patch).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/expedientes');
}

export async function deleteExpedienteAction(id: number) {
  const supabase = createClient();
  const { error } = await supabase.from('expedientes').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/expedientes');
}
