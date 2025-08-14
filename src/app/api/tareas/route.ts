import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET() {
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from('tareas')
      .select('id, expediente_id, titulo, estado, prioridad, horas_previstas, horas_realizadas, vencimiento')
      .order('vencimiento', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sb = supabaseAdmin();
    if (!body?.expediente_id || !body?.titulo) {
      return NextResponse.json({ ok:false, error:'Faltan expediente_id o titulo' }, { status: 400 });
    }
    const { data, error } = await sb
      .from('tareas')
      .insert({
        expediente_id: body.expediente_id,
        titulo: body.titulo,
        estado: body.estado ?? null,
        prioridad: body.prioridad ?? null,
        horas_previstas: body.horas_previstas ?? null,
        // horas_realizadas se calcula vía partes; aquí no se toca
        vencimiento: body.vencimiento ?? null
      })
      .select('id')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, id: data.id });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 });
  }
}
