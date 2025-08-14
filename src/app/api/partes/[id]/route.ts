import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const sb = supabaseAdmin();

    const { data, error } = await sb
      .from('partes')
      .update({
        fecha: body.fecha ?? undefined,                 // YYYY-MM-DD
        inicio: body.inicio ?? undefined,               // HH:MM
        fin: body.fin ?? undefined,                     // HH:MM
        horas: body.horas ?? undefined,                 // number
        expediente_id: body.expediente_id ?? undefined, // uuid
        tarea_id: body.tarea_id ?? undefined,           // uuid | null
        comentario: body.comentario ?? undefined
      })
      .eq('id', params.id)
      .select('id');

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ ok:false, error:'No se encontró el parte o no se actualizó ninguna fila.' }, { status:404 });
    }
    return NextResponse.json({ ok:true, updated:data.length });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e.message }, { status:400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from('partes')
      .delete()
      .eq('id', params.id)
      .select('id');

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ ok:false, error:'No se encontró el parte o no se borró ninguna fila.' }, { status:404 });
    }
    return NextResponse.json({ ok:true, deleted:data.length });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e.message }, { status:400 });
  }
}
