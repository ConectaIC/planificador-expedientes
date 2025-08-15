// src/app/partes/actions.ts
'use server';

import { supabaseAdmin } from '../../lib/supabaseAdmin';

function diffHorasRedondeadas15(inicio: string, fin: string): number {
  // inicio/fin en formato "HH:MM"
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  const d1 = h1 * 60 + m1;
  const d2 = h2 * 60 + m2;
  const min = Math.max(0, d2 - d1);
  const redondeo = Math.round(min / 15) * 15; // redondeo a bloques de 15'
  return redondeo / 60;
}

export async function createParte(formData: FormData) {
  const fecha = String(formData.get('fecha') || '').slice(0, 10);
  const inicio = String(formData.get('inicio') || '');
  const fin = String(formData.get('fin') || '');
  const comentario = String(formData.get('comentario') || '');
  const expediente_id = Number(formData.get('expediente_id') || 0) || null;
  const tarea_id = Number(formData.get('tarea_id') || 0) || null;

  if (!fecha || !inicio || !fin || !expediente_id || !tarea_id) {
    return { ok: false, error: 'Faltan campos obligatorios' };
  }

  const horas = diffHorasRedondeadas15(inicio, fin);

  const sb = supabaseAdmin();
  const { error } = await sb.from('partes').insert({
    fecha,
    inicio,
    fin,
    horas,
    comentario: comentario || null,
    expediente_id,
    tarea_id,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
