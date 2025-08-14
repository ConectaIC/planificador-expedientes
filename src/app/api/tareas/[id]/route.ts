// src/app/api/tareas/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

const ESTADOS_TAREA = new Set(['Pendiente','En curso','Completada']);

function pickEstado(value: any): string | undefined {
  if (typeof value !== 'string') return undefined;
  // normaliza capitalización básica
  const v = value.trim().toLowerCase();
  if (v === 'pendiente') return 'Pendiente';
  if (v === 'en curso' || v === 'curso') return 'En curso';
  if (v === 'completada' || v === 'completado') return 'Completada';
  return undefined;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const sb = supabaseAdmin();

    // Saneamos estado a los 3 valores admitidos (o lo omitimos)
    const estado = pickEstado(body.estado);

    const payload: any = {
      titulo: body.titulo ?? undefined,
      prioridad: body.prioridad ?? undefined,
      vencimiento: body.vencimiento ?? undefined,
      horas_previstas: body.horas_previstas ?? undefined,
      horas_realizadas: body.horas_realizadas ?? undefined,
      expediente_id: body.expediente_id ?? undefined,
    };
    if (estado && ESTADOS_TAREA.has(estado)) payload.estado = estado;

    const { data, error } = await sb
      .from('tareas')
      .update(payload)
      .eq('id', params.id)
      .select('id');

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ ok:false, error:'No se actualizó ninguna fila' }, { status:404 });
    }
    return NextResponse.json({ ok:true, updated:data.length });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e.message }, { status:400 });
  }
}
