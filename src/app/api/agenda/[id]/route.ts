import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sb = supabaseAdmin();
    const { error } = await sb.from('agenda').delete().eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
