// src/app/expedientes/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import FiltrosExpedientes, { Expediente } from '../../components/FiltrosExpedientes';
import NuevoExpediente from '../../components/NuevoExpediente';

export default async function ExpedientesPage() {
  const sb = supabaseAdmin();

  // 1) Expedientes
  const { data: expedientes, error } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto, cliente, fin, prioridad, estado');

  if (error) {
    return (
      <main>
        <h2>Expedientes</h2>
        <p>Error al cargar: {error.message}</p>
      </main>
    );
  }

  // 2) Partes -> totales por expediente_id
  const { data: partes } = await sb
    .from('partes')
    .select('expediente_id, horas')
    .not('expediente_id', 'is', null);

  const totalPorId = new Map<string, number>();
  (partes || []).forEach((p: any) => {
    const id = p.expediente_id as string;
    const h = typeof p.horas === 'number' ? p.horas : Number(p.horas || 0);
    totalPorId.set(id, (totalPorId.get(id) || 0) + (isNaN(h) ? 0 : h));
  });

  const lista: Expediente[] = (expedientes || []).map((e: any) => ({
    id: e.id,
    codigo: e.codigo,
    proyecto: e.proyecto,
    cliente: e.cliente,
    fin: e.fin,                   // YYYY-MM-DD (no formatear aquí)
    prioridad: e.prioridad,
    estado: e.estado,
    horasTotales: totalPorId.get(e.id) ?? 0,
  }));

  return (
    <main>
      <h2>Expedientes</h2>
      <p>Total: {lista.length}</p>

      <FiltrosExpedientes expedientes={lista} />

      <div style={{ marginTop: 16 }}>
        <NuevoExpediente />
      </div>
    </main>
  );
}
