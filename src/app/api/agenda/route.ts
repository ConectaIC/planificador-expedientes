import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start'); // YYYY-MM-DD
  const end = searchParams.get('end');     // YYYY-MM-DD

  const sb = supabaseAdmin();
  let q = sb.from('agenda').select('*');
  if (start) q = q.gte('fecha', start);
  if (end) q = q.lte('fecha', end);
  const { data, error } = await q.order('fecha', { ascending: true });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fecha, tramo, tipo, horas, expediente_codigo, notas } = body;

    const sb = supabaseAdmin();
    let expediente_id: string | null = null;

    if (tipo === 'Expediente' && expediente_codigo) {
      const { data: exp, error: e1 } = await sb.from('expedientes').select('id').eq('codigo', expediente_codigo).maybeSingle();
      if (e1) throw e1;
      expediente_id = exp?.id ?? null;
    }

    const { error } = await sb.from('agenda').insert({
      fecha: fecha ? new Date(fecha) : null,
      tramo,
      tipo,
      horas: horas ? Number(horas) : 0,
      expediente_id,
      notas: notas || null
    });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
