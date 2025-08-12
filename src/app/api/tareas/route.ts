import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { codigo, titulo, horas_previstas, prioridad, vencimiento, notas } = body;

    const sb = supabaseAdmin();
    // localizar el expediente por código
    const { data: exp, error: e1 } = await sb.from('expedientes').select('id').eq('codigo', codigo).maybeSingle();
    if (e1) throw e1;
    if (!exp) throw new Error(`Expediente no encontrado: ${codigo}`);

    const { error: e2 } = await sb.from('tareas').insert({
      expediente_id: exp.id,
      titulo,
      horas_previstas: horas_previstas ? Number(horas_previstas) : null,
      prioridad: prioridad || null,
      vencimiento: vencimiento ? new Date(vencimiento) : null,
      notas: notas || null,
      estado: 'Pendiente',
    });
    if (e2) throw e2;

    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
