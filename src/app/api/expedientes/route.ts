import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// GET /api/expedientes  -> lista breve para el desplegable
export async function GET() {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto')
    .order('codigo', { ascending: true });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, data });
}

// (Opcional) POST /api/expedientes -> upsert sencillo por código
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { codigo, proyecto, cliente, fin, prioridad, estado } = body;
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from('expedientes')
      .upsert(
        { codigo, proyecto, cliente, fin: fin ? new Date(fin) : null, prioridad, estado },
        { onConflict: 'codigo' }
      )
      .select();
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
