// src/app/api/tareas/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const sb = supabaseAdmin();
    const { error } = await sb.from('tareas').update({
      titulo: body.titulo ?? undefined,
      estado: body.estado ?? undefined,
      prioridad: body.prioridad ?? undefined,
      horas_previstas: body.horas_previstas ?? undefined,
      vencimiento: body.vencimiento ?? undefined
      // horas_realizadas la mantiene el trigger con PARTES
    }).eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sb = supabaseAdmin();
    const { error } = await sb.from('tareas').delete().eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 });
  }
}
