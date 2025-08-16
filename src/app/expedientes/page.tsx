import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import ExpedienteModal from '@/components/ExpedienteModal';
import Modal from '@/components/Modal'; // para confirmación simple
import React from 'react';

type Expediente = {
  id: number;
  codigo: string;
  proyecto: string;
  cliente: string;
  inicio?: string | null;
  fin?: string | null;
  prioridad?: 'Baja' | 'Media' | 'Alta';
  estado?: 'Pendiente' | 'En curso' | 'En supervisión' | 'Entregado' | 'Cerrado';
  horas_previstas?: number | null;
  horas_reales?: number | null;
};

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

async function fetchExpedientes(q?: string, estado?: string, prioridad?: string, orderBy?: string) {
  const supa = getAdmin();
  let query = supa.from('expedientes').select('*');
  if (q && q.trim()) {
    query = query.or(`codigo.ilike.%${q}%,proyecto.ilike.%${q}%,cliente.ilike.%${q}%`);
  }
  if (estado && estado !== 'Todos') query = query.eq('estado', estado);
  if (prioridad && prioridad !== 'Todas') query = query.eq('prioridad', prioridad);

  // orden
  switch (orderBy) {
    case 'fecha':
      query = query.order('inicio', { ascending: false, nullsFirst: false });
      break;
    case 'horas':
      query = query.order('horas_reales', { ascending: false, nullsFirst: true });
      break;
    default:
      query = query.order('codigo', { ascending: true });
  }

  const { data, error } = await query;
  if (error) throw new Error(`Error al cargar expedientes: ${error.message}`);
  return (data ?? []) as Expediente[];
}

// Server Actions
export async function createExpedienteAction(form: FormData) {
  'use server';
  const supa = getAdmin();
  const payload = {
    codigo: String(form.get('codigo') ?? ''),
    proyecto: String(form.get('proyecto') ?? ''),
    cliente: String(form.get('cliente') ?? ''),
    inicio: String(form.get('inicio') ?? '') || null,
    fin: String(form.get('fin') ?? '') || null,
    prioridad: String(form.get('prioridad') ?? 'Media'),
    estado: String(form.get('estado') ?? 'Pendiente'),
  };
  const { error } = await supa.from('expedientes').insert(payload);
  if (error) throw new Error(error.message);
}

export async function updateExpedienteAction(form: FormData) {
  'use server';
  const supa = getAdmin();
  const id = Number(form.get('id'));
  const payload = {
    codigo: String(form.get('codigo') ?? ''),
    proyecto: String(form.get('proyecto') ?? ''),
    cliente: String(form.get('cliente') ?? ''),
    inicio: String(form.get('inicio') ?? '') || null,
    fin: String(form.get('fin') ?? '') || null,
    prioridad: String(form.get('prioridad') ?? 'Media'),
    estado: String(form.get('estado') ?? 'Pendiente'),
  };
  const { error } = await supa.from('expedientes').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteExpedienteAction(form: FormData) {
  'use server';
  const supa = getAdmin();
  const id = Number(form.get('id'));
  // Nota: si hay FK en tareas/partes, Supabase debe tener ON DELETE o manejamos previo borrado de dependientes.
  const { error } = await supa.from('expedientes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export default async function Page({ searchParams }: { searchParams: any }) {
  const q = searchParams?.q ?? '';
  const estado = searchParams?.estado ?? 'Todos';
  const prioridad = searchParams?.prioridad ?? 'Todas';
  const orderBy = searchParams?.orden ?? 'codigo';

  const expedientes = await fetchExpedientes(q, estado, prioridad, orderBy);

  // Estados de modal (con Server Components, los controlan Client Components)
  // Renderizamos contenedores "slots" y dejamos la UI al cliente.
  return (
    <main className="container">
      <div className="toolbar">
        <form method="get" className="filters">
          <input name="q" placeholder="Buscar por código, proyecto o cliente" defaultValue={q} className="input" />
          <select name="estado" defaultValue={estado} className="input" onChange={(e)=> e.currentTarget.form?.submit()}>
            <option>Todos</option>
            <option>Pendiente</option>
            <option>En curso</option>
            <option>En supervisión</option>
            <option>Entregado</option>
            <option>Cerrado</option>
          </select>
          <select name="prioridad" defaultValue={prioridad} className="input" onChange={(e)=> e.currentTarget.form?.submit()}>
            <option>Todas</option>
            <option>Baja</option>
            <option>Media</option>
            <option>Alta</option>
          </select>
          <select name="orden" defaultValue={orderBy} className="input" onChange={(e)=> e.currentTarget.form?.submit()}>
            <option value="codigo">Ordenar: Código</option>
            <option value="fecha">Ordenar: Fecha inicio</option>
            <option value="horas">Ordenar: Horas imputadas</option>
          </select>
        </form>
        {/* Botón ➕ abre modal de nuevo */}
        <CreateExpedienteButton />
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Proyecto</th>
            <th>Cliente</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Horas prev.</th>
            <th>Horas reales</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {expedientes.map((e) => (
            <tr key={e.id}>
              <td>
                <Link href={`/expedientes/${encodeURIComponent(e.codigo)}`} className="btn-link">
                  {e.codigo}
                </Link>
              </td>
              <td>{e.proyecto || '—'}</td>
              <td>{e.cliente || '—'}</td>
              <td>{e.inicio || '—'}</td>
              <td>{e.fin || '—'}</td>
              <td>{e.prioridad || '—'}</td>
              <td>{e.estado || '—'}</td>
              <td>{Number(e.horas_previstas ?? 0).toFixed(2)}</td>
              <td>{Number(e.horas_reales ?? 0).toFixed(2)}</td>
              <td>
                <span style={{ display: 'inline-flex', gap: 6 }}>
                  <EditExpedienteButton expediente={e} />
                  <DeleteExpedienteButton id={e.id} />
                </span>
              </td>
            </tr>
          ))}
          {expedientes.length === 0 && (
            <tr>
              <td colSpan={10} style={{ textAlign: 'center', padding: 16 }}>No hay expedientes.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}

/** Client wrappers para abrir modales con server actions */
function CreateExpedienteButton() {
  return (
    <ClientCreateExpediente action={createExpedienteAction} />
  );
}
function EditExpedienteButton({ expediente }: { expediente: any }) {
  return (
    <ClientEditExpediente expediente={expediente} action={updateExpedienteAction} />
  );
}
function DeleteExpedienteButton({ id }: { id: number }) {
  return (
    <ClientDeleteExpediente id={id} action={deleteExpedienteAction} />
  );
}

/* ---------- Sección client-only: control de modales ---------- */
function ClientBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

'use client';
import { useState } from 'react';

function ClientCreateExpediente({ action }: { action: (form: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  return (
    <>
      <button aria-label="Nuevo expediente" className="icon-btn" onClick={() => setOpen(true)}>➕</button>
      <ExpedienteModal
        open={open}
        onClose={() => setOpen(false)}
        initial={null}
        title="Nuevo expediente"
        submitting={submitting}
        onSubmit={async (fd) => {
          setSubmitting(true);
          try { await action(fd); } finally { setSubmitting(false); }
        }}
      />
    </>
  );
}

function ClientEditExpediente({
  expediente,
  action,
}: {
  expediente: any;
  action: (form: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  return (
    <>
      <button aria-label="Editar expediente" className="icon-btn" onClick={() => setOpen(true)}>✏️</button>
      <ExpedienteModal
        open={open}
        onClose={() => setOpen(false)}
        initial={expediente}
        title="Editar expediente"
        submitting={submitting}
        onSubmit={async (fd) => {
          fd.set('id', String(expediente.id));
          setSubmitting(true);
          try { await action(fd); } finally { setSubmitting(false); }
        }}
      />
    </>
  );
}

function ClientDeleteExpediente({
  id,
  action,
}: {
  id: number;
  action: (form: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <>
      <button aria-label="Borrar expediente" className="icon-btn" onClick={() => setOpen(true)}>🗑️</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Confirmar borrado">
        <p>¿Seguro que deseas borrar este expediente?</p>
        <form
          action={async (fd) => {
            fd.set('id', String(id));
            setSubmitting(true);
            try { await action(fd); } finally { setSubmitting(false); }
          }}
          style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}
        >
          <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>✖️</button>
          <button type="submit" className="btn-danger" disabled={submitting}>{submitting ? '…' : '🗑️'}</button>
        </form>
      </Modal>
    </>
  );
}
