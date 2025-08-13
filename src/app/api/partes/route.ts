// src/app/api/partes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

/**
 * GET /api/partes?limit=100
 * Devuelve partes recientes desde la vista partes_view
 * (incluye texto de expediente y título de tarea si existe).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') || 100);

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('partes_view')
    .select('*')
    .order('fecha', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, data });
}

/**
 * POST /api/partes
 * Crea un parte. Si no vienen "horas" pero sí "inicio" y "fin",
 * calcula horas en backend. Vincula por "expediente" (código) y
 * opcionalmente por "tarea_id". La actualización de horas_realizadas
 * de la tarea la hace un TRIGGER en BD.
 *
 * Body (JSON):
 *  {
 *    fecha: '2025-08-12',
 *    inicio: '08:00', fin: '10:15', horas?: 2.25,
 *    expediente: '25.201ATG',
 *    tarea_id?: 'uuid-de-tareas',
 *    comentario?: 'texto'
 *  }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const fecha = body.fecha ? new Date(body.fecha) : null;

    let horas = body.horas ? parseFloat(body.horas) : null;
    const inicio: string | null = body.inicio ?? null;
    const fin: string | null = body.fin ?? null;

    // Si no viene "horas", calcular desde inicio/fin
    if (!horas && inicio && fin) {
      const [h1, m1] = String(inicio).split(':').map(Number);
      const [h2, m2] = String(fin).split(':').map(Number);
      if (!isNaN(h1) && !isNaN(h2)) {
        let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (mins < 0) mins += 24 * 60; // si cruza medianoche
        horas = Math.round((mins / 60) * 100) / 100;
      }
    }

    const expedienteCodigo = String(body.expediente || '').trim();
    const comentario = String(body.comentario || '');
    const tareaId = body.tarea_id ? String(body.tarea_id) : null;

    const sb = supabaseAdmin();

    // Localizar expediente por código → obtener id
    let expediente_id: string | null = null;
    if (expedienteCodigo) {
      const { data: exp, error: eExp } = await sb
        .from('expedientes')
        .select('id')
        .eq('codigo', expedienteCodigo)
        .maybeSingle();
      if (eExp) throw eExp;
      expediente_id = exp?.id ?? null;
    }

    // Insertar parte (el trigger actualizará tareas.horas_realizadas si hay tarea_id)
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

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
