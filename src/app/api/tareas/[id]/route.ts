// src/app/api/tareas/[id]/route.ts
// Tipo: Route Handler (añadimos DELETE)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const sb = supabaseAdmin();

    const payload: any = {
      titulo: body?.titulo ?? undefined,
      expediente_id: body?.expediente_id ?? undefined,
      estado: body?.estado ?? null,
      prioridad: body?.prioridad ?? null,
      horas_previstas: body?.horas_previstas ?? null,
      vencimiento: body?.vencimiento ?? null,
    };

    const { data, error } = await sb.from('tareas').update(payload).eq('id', params.id).select('id');
    if (error) throw error;
    if (!data || data.length === 0) return NextResponse.json({ ok: false, error: 'No actualizado' }, { status: 404 });
    return NextResponse.json({ ok: true, updated: data.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb.from('tareas').delete().eq('id', params.id).select('id');
    if (error) throw error;
    if (!data || data.length === 0) return NextResponse.json({ ok: false, error: 'No borrado' }, { status: 404 });
    return NextResponse.json({ ok: true, deleted: data.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
