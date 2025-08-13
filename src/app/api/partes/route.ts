import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') || 50);

  const sb = supabaseAdmin();
  // Listar partes recientes con datos básicos del expediente y (opcional) la tarea
  const { data, error } = await sb
    .from('partes_view') // si no existe, usamos join manual (ver más abajo)
    .select('*')
    .order('fecha', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const fecha = body.fecha ? new Date(body.fecha) : null;
    let horas = body.horas ? parseFloat(body.horas) : null;

    const inicio: string | null = body.inicio ?? null;
    const fin: string | null = body.fin ?? null;

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
    const tareaId = body.tarea_id ? String(body.tarea_id) : null;

    const sb = supabaseAdmin();

    // buscar expediente por código
    let expediente_id: string | null = null;
    if (expedienteCodigo) {
      const { data: exp, error: eExp } = await sb.from('expedientes').select('id').eq('codigo', expedienteCodigo).maybeSingle();
      if (eExp) throw eExp;
      expediente_id = exp?.id ?? null;
    }

    // insertar parte
    const { error } = await sb.from('partes').insert({
      fecha,
      hora_inicio: inicio || null,
      hora_fin: fin || null,
      horas: horas ?? null,
      comentario,
      expediente_id,
      tarea_id: tareaId || null
    });
    if (error) throw error;

    // si viene tarea_id, sumar horas a la tarea
    if (tareaId && horas && !isNaN(horas)) {
      const { data: t0, error: et0 } = await sb.from('tareas').select('horas_realizadas').eq('id', tareaId).maybeSingle();
      if (et0) throw et0;
      const acumuladas = (t0?.horas_realizadas ?? 0) + horas;
      const { error: et1 } = await sb.from('tareas').update({ horas_realizadas: acumuladas }).eq('id', tareaId);
      if (et1) throw et1;
    }

    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
