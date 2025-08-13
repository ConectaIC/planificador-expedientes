import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const codigo = searchParams.get('codigo');
  if (!codigo) return NextResponse.json({ ok:false, error:'Falta código' }, { status: 400 });

  const sb = supabaseAdmin();
  const { data: exp, error: e1 } = await sb.from('expedientes').select('id').eq('codigo', codigo).maybeSingle();
  if (e1) return NextResponse.json({ ok:false, error:e1.message }, { status: 400 });
  if (!exp) return NextResponse.json({ ok:false, error:'Expediente no encontrado' }, { status: 404 });

  const { data: tareas, error: e2 } = await sb.from('tareas')
    .select('id, titulo')
    .eq('expediente_id', exp.id)
    .order('vencimiento', { ascending: true });
  if (e2) return NextResponse.json({ ok:false, error:e2.message }, { status: 400 });

  return NextResponse.json({ ok:true, data: tareas || [] });
}
