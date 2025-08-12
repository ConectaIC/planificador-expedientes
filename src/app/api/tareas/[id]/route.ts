import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updates: any = {};

    if (body.estado !== undefined) updates.estado = String(body.estado);
    if (body.horas_realizadas !== undefined) {
      const n = Number(body.horas_realizadas);
      updates.horas_realizadas = isNaN(n) ? null : n;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: 'Sin cambios' }, { status: 400 });
    }

    const sb = supabaseAdmin();
    const { error } = await sb.from('tareas').update(updates).eq('id', params.id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
