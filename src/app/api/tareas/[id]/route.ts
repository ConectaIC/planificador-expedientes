import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const sb = supabaseAdmin();

    const { data, error } = await sb
      .from('tareas')
      .update({
        titulo: body.titulo ?? undefined,
        estado: body.estado ?? undefined,
        prioridad: body.prioridad ?? undefined,
        horas_previstas: body.horas_previstas ?? undefined,
        vencimiento: body.vencimiento ?? undefined
      })
      .eq('id', params.id)
      .select('id'); // ← filas afectadas

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ ok:false, error:'No se encontró la tarea o no se actualizó ninguna fila.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, updated: data.length });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from('tareas')
      .delete()
      .eq('id', params.id)
      .select('id'); // ← filas afectadas

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ ok:false, error:'No se encontró la tarea o no se borró ninguna fila.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, deleted: data.length });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 });
  }
}
