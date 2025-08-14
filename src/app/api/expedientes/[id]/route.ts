import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const sb = supabaseAdmin();

    const { data, error } = await sb
      .from('expedientes')
      .update({
        codigo: body.codigo ?? undefined,
        proyecto: body.proyecto ?? undefined,
        cliente: body.cliente ?? undefined,
        fin: body.fin ?? undefined,
        prioridad: body.prioridad ?? undefined,
        estado: body.estado ?? undefined
      })
      .eq('id', params.id)
      .select('id'); // <- devuelve filas afectadas

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ ok: false, error: 'No se encontró el expediente o no se actualizó ninguna fila.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, updated: data.length });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from('expedientes')
      .delete()
      .eq('id', params.id)
      .select('id'); // <- devuelve filas afectadas

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ ok: false, error: 'No se encontró el expediente o no se borró ninguna fila.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, deleted: data.length });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message }, { status: 400 });
  }
}
