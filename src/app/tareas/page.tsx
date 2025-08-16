import { createClient } from '@/lib/supabaseServer';
import TareaRowActions, { Tarea } from '@/components/TareaRowActions';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

async function fetchTareas(): Promise<(Tarea & { expediente_codigo?: string | null })[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tareas')
    .select('id,expediente_id,titulo,vencimiento,prioridad,estado,horas_previstas,horas_realizadas,tipo,descripcion,expedientes(codigo)')
    .order('vencimiento', { ascending: true, nullsFirst: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((t: any) => ({ ...t, expediente_codigo: t.expedientes?.codigo ?? null }));
}

export default async function Page() {
  const tareas = await fetchTareas();

  const onMutate = async () => {
    'use server';
    revalidatePath('/tareas');
    revalidatePath('/expedientes');
  };

  return (
    <main className="container">
      <h1 className="page-title mb-4">Tareas</h1>

      {/* Filtros/búsqueda en cliente */}
      <ClientFilters tareas={tareas} onMutate={onMutate} />
    </main>
  );
}

/* ---------- Cliente: filtros & tabla ---------- */
'use client';
import { useMemo, useState } from 'react';

function ClientFilters({
  tareas,
  onMutate,
}: {
  tareas: (Tarea & { expediente_codigo?: string | null })[];
  onMutate: () => void;
}) {
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('todos');
  const [prioridad, setPrioridad] = useState('todas');

  const filtered = useMemo(() => {
    return tareas.filter((t) => {
      const okQ =
        !q ||
        (t.titulo?.toLowerCase().includes(q.toLowerCase()) ||
          t.expediente_codigo?.toLowerCase().includes(q.toLowerCase()));
      const okE = estado === 'todos' || (t.estado ?? '').toLowerCase() === estado;
      const okP = prioridad === 'todas' || (t.prioridad ?? '').toLowerCase() === prioridad;
      return okQ && okE && okP;
    });
  }, [tareas, q, estado, prioridad]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <input className="rounded-md border px-3 py-2" placeholder="Buscar por código o título"
               value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="rounded-md border px-3 py-2" value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
          <option value="todas">Prioridad: todas</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
        <select className="rounded-md border px-3 py-2" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="todos">Estado: todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="en curso">En curso</option>
          <option value="completada">Completada</option>
        </select>
      </div>

      <div className="table-card">
        <table className="table">
          <thead>
            <tr>
              <th>Expediente</th>
              <th>Título</th>
              <th>Vencimiento</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Horas (prev/real)</th>
              <th style={{ width: 100, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td>
                  {t.expediente_codigo ? (
                    <Link href={`/expedientes/${encodeURIComponent(t.expediente_codigo)}`} className="link">
                      {t.expediente_codigo}
                    </Link>
                  ) : '—'}
                </td>
                <td>{t.titulo}</td>
                <td>{t.vencimiento ?? '—'}</td>
                <td>{t.prioridad ?? '—'}</td>
                <td>{t.estado ?? '—'}</td>
                <td>{(t.horas_previstas ?? 0).toFixed(2)} / {(t.horas_realizadas ?? 0).toFixed(2)}</td>
                <td>
                  <TareaRowActions tarea={t} onMutate={onMutate} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
