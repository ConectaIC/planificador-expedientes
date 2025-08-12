import { supabaseAdmin } from '../../lib/supabaseAdmin';
import CopyBox from '../../components/CopyBox';

function yyyymmdd(d: Date) {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

function fmtES(d: string) {
  const dt = new Date(d);
  return isNaN(+dt) ? d : dt.toLocaleDateString('es-ES');
}

export default async function ResumenPage({ searchParams }: { searchParams?: { rango?: string } }) {
  const rango = (searchParams?.rango || 'hoy').toLowerCase(); // 'hoy' | '7d'
  const hoy = new Date();
  const desde = new Date(hoy);
  if (rango === '7d') desde.setDate(hoy.getDate() - 6);

  const sb = supabaseAdmin();

  // Partes en rango
  const { data: partes, error } = await sb
    .from('partes')
    .select('id, fecha, horas, comentario, expediente_id')
    .gte('fecha', yyyymmdd(desde))
    .lte('fecha', yyyymmdd(hoy))
    .order('fecha', { ascending: true });

  if (error) {
    return <main><h2>Resumen para asistente</h2><p>Error al cargar: {error.message}</p></main>;
  }

  // Mapa expediente_id → "COD — Proyecto"
  const ids = Array.from(new Set((partes || []).map(p => p.expediente_id).filter(Boolean))) as string[];
  let labelById = new Map<string, string>();
  if (ids.length) {
    const { data: exps } = await sb
      .from('expedientes')
      .select('id, codigo, proyecto')
      .in('id', ids);
    exps?.forEach((e: any) => labelById.set(e.id, `${e.codigo} — ${e.proyecto}`));
  }

  // Totales por expediente
  const totales = new Map<string, number>();
  (partes || []).forEach(p => {
    const label = p.expediente_id ? (labelById.get(p.expediente_id) || 'Sin expediente') : 'Sin expediente';
    const h = typeof p.horas === 'number' ? p.horas : 0;
    totales.set(label, (totales.get(label) || 0) + h);
  });

  // Próximas entregas (14 días)
  const { data: proximas } = await sb
    .from('expedientes')
    .select('codigo, proyecto, fin')
    .gte('fin', yyyymmdd(hoy))
    .lte('fin', yyyymmdd(new Date(hoy.getTime() + 14 * 86400000)))
    .order('fin', { ascending: true });

  // Construir texto
  const rangoTexto = rango === '7d'
    ? `Del ${fmtES(yyyymmdd(desde))} al ${fmtES(yyyymmdd(hoy))}`
    : `Hoy ${fmtES(yyyymmdd(hoy))}`;

  const lineas: string[] = [];
  lineas.push(`RESUMEN – ${rangoTexto}`);
  lineas.push('');
  if (!partes || partes.length === 0) {
    lineas.push('• No se registraron partes en el rango seleccionado.');
  } else {
    // Detalle por día
    let fechaActual = '';
    for (const p of partes) {
      const f = fmtES(p.fecha);
      if (f !== fechaActual) { lineas.push(`- ${f}`); fechaActual = f; }
      const label = p.expediente_id ? (labelById.get(p.expediente_id) || 'Sin expediente') : 'Sin expediente';
      const h = typeof p.horas === 'number' ? p.horas : (p.horas ? Number(p.horas) : 0);
      const com = p.comentario ? ` – ${p.comentario}` : '';
      lineas.push(`   · ${label}: ${h || 0} h${com}`);
    }
    lineas.push('');
    lineas.push('Totales por expediente:');
    for (const [k, v] of totales.entries()) lineas.push(`   · ${k}: ${v.toFixed(2)} h`);
  }
  lineas.push('');
  lineas.push('Entregas próximas (≤ 14 días):');
  if (!proximas || proximas.length === 0) {
    lineas.push('   · Sin entregas en las próximas dos semanas.');
  } else {
    proximas.forEach((e: any) => lineas.push(`   · ${e.codigo} – ${e.proyecto} (Fin: ${fmtES(e.fin)})`));
  }

  const texto = lineas.join('\n');

  return (
    <main>
      <h2>Resumen para asistente</h2>
      <p>
        Rango: <a href="/resumen?rango=hoy">Hoy</a> · <a href="/resumen?rango=7d">Últimos 7 días</a>
      </p>
      <CopyBox text={texto} />
      <p style={{ fontSize: 12, opacity: 0.8 }}>
        Copia el texto y pégalo aquí en el chat para replanificar automáticamente.
      </p>
    </main>
  );
}
