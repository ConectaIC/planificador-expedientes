// src/app/api/partes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

function calcHours(inicio?: string|null, fin?: string|null) {
  if (!inicio || !fin) return null;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  if ([h1,m1,h2,m2].some(n => Number.isNaN(n))) return null;
  const t1 = h1*60 + m1;
  const t2 = h2*60 + m2;
  const diff = t2 - t1;
  if (diff <= 0) return 0;
  return Math.round((diff/60) * 4) / 4; // redondeo a 0.25 h
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const sb = supabaseAdmin();

    const inicio: string | null = body.inicio ?? null; // HH:MM
    const fin: string | null    = body.fin ?? null;
    const horasBody: number | null = (typeof body.horas === 'number' ? body.horas : null);
    const horas = horasBody ?? calcHours(inicio, fin);

    const payload: any = {
      fecha: body.fecha ?? undefined,
      hora_inicio: inicio ?? undefined,
      hora_fin: fin ?? undefined,
      horas: horas ?? undefined,
      comentario: body.comentario ?? undefined,
      expediente_id: body.expediente_id ?? undefined,
      tarea_id: body.tarea_id ?? undefined,
      usuario_email: body.usuario_email ?? undefined,
    };

    const { data, error } = await sb.from('partes').update(payload).eq('id', params.id).select('id');
    if (error) throw error;
    if (!data || data.length === 0) return NextResponse.json({ ok:false, error:'No actualizado' }, { status:404 });
    return NextResponse.json({ ok:true, updated:data.length });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e.message }, { status:400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb.from('partes').delete().eq('id', params.id).select('id');
    if (error) throw error;
    if (!data || data.length === 0) return NextResponse.json({ ok:false, error:'No borrado' }, { status:404 });
    return NextResponse.json({ ok:true, deleted:data.length });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e.message }, { status:400 });
  }
}
