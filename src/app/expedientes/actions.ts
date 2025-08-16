'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabaseServer';

export type ExpedienteInput = {
  codigo: string;
  proyecto?: string | null;
  cliente?: string | null;
  estado?: string | null;
  presupuesto?: number | null;
};

export async function createExpedienteAction(formData: FormData) {
  const supabase = createClient();
  const payload: ExpedienteInput = {
    codigo: String(formData.get('codigo') ?? '').trim(),
    proyecto: (formData.get('proyecto') as string) || null,
    cliente: (formData.get('cliente') as string) || null,
    estado: (formData.get('estado') as string) || null,
    presupuesto: formData.get('presupuesto')
      ? Number(formData.get('presupuesto'))
      : null,
  };

  if (!payload.codigo) {
    throw new Error('El código es obligatorio');
  }

  const { error } = await supabase.from('expedientes').insert(payload);
  if (error) throw new Error(error.message);
}

export async function updateExpedienteAction(formData: FormData) {
  const supabase = createClient();

  const idRaw = formData.get('id');
  const id = typeof idRaw === 'string' ? Number(idRaw) : Number(idRaw || 0);
  if (!id) throw new Error('ID de expediente no válido');

  const updates: Partial<ExpedienteInput> = {
    codigo: String(formData.get('codigo') ?? '').trim(),
    proyecto: (formData.get('proyecto') as string) || null,
    cliente: (formData.get('cliente') as string) || null,
    estado: (formData.get('estado') as string) || null,
    presupuesto: formData.get('presupuesto')
      ? Number(formData.get('presupuesto'))
      : null,
  };

  if (!updates.codigo) {
    throw new Error('El código es obligatorio');
  }

  const { error } = await supabase.from('expedientes').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteExpedienteAction(formData: FormData) {
  const supabase = createClient();
  const idRaw = formData.get('id');
  const id = typeof idRaw === 'string' ? Number(idRaw) : Number(idRaw || 0);
  if (!id) throw new Error('ID de expediente no válido');

  const { error } = await supabase.from('expedientes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
