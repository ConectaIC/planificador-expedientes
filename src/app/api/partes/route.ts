import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const fecha = body.fecha ? new Date(body.fecha) : null;
    let horas = body.horas ? parseFloat(body.horas) : null;

    const inicio: string | null = body.inicio ?? null;
    const fin: string | null = body.fin ?? null;

    // Si no nos pasan horas pero sí inicio/fin → calcular
    if (!horas && inicio && fin) {
      const [h1, m1] = String(inicio).split(':').map(Number);
      const [h2, m2] = String(fin).split(':').map(Number);
      if (!isNaN(h1) && !isNaN(h2)) {
        let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (mins < 0) mins += 24 * 60;
        horas = Math.round((mins / 60) * 100) / 100;
      }
    }

    const expedienteCodigo = String(body.expediente || '').trim();
    const comentario = String(body.comentario || '');

    const sb = supabaseAdmin();

    // buscar expediente por código
    let expediente_id: string | null = null;
    if (expedienteCodigo) {
      const { data: exp, error: eExp } = await sb.from('expedientes').select('id').eq('codigo', expedienteCodigo).maybeSingle();
      if (eExp) throw eExp;
      expediente_id = exp?.id ?? null;
    }

    const { error } = await sb.from('partes').insert({
      fecha,
      hora_inicio: inicio || null,
      hora_fin: fin || null,
      horas: horas ?? null,
      comentario,
      expediente_id
    });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
