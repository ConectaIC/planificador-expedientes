// src/app/api/partes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

function calcHours(inicio?: string|null, fin?: string|null) {
  if (!inicio || !fin) return null;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  if ([h1,m1,h2,m2].some(n => Number.isNaN(n))) return null;
  const t1 = h1*60 + m1;
  const t2 = h2*60 + m2;
  const diff = t2 - t1;
  if (diff <= 0) return 0;
  // redondeo a cuartos
  return Math.round((diff/60) * 4) / 4;
}

export async function GET() {
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from('partes')
      .select('id, fecha, hora_inicio, hora_fin, horas, comentario, expediente_id, tarea_id')
      .order('fecha', { ascending: false })
      .limit(100);
    if (error) throw error;
    return NextResponse.json({ ok:true, data });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sb = supabaseAdmin();

    const fecha: string | null = (body.fecha ?? null);
    const inicio: string | null = (body.inicio ?? null); // HH:MM
    const fin: string | null = (body.fin ?? null);       // HH:MM
    const horasBody: number | null = (typeof body.horas === 'number' ? body.horas : null);

    const horas = horasBody ?? calcHours(inicio, fin);

    const payload: any = {
      fecha: fecha,
      hora_inicio: inicio,
      hora_fin: fin,
      horas: horas,
      comentario: body.comentario ?? null,
      expediente_id: body.expediente_id ?? null,
      tarea_id: body.tarea_id ?? null,
      usuario_email: body.usuario_email ?? null,
    };

    const { data, error } = await sb.from('partes').insert(payload).select('id');
    if (error) throw error;
    return NextResponse.json({ ok:true, id: data?.[0]?.id });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 });
  }
}
