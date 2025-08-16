import { createClient } from '@supabase/supabase-js';
import TaskModal from '@/components/TaskModal';
import Link from 'next/link';
import React from 'react';

type Expediente = { id: number; codigo: string; proyecto?: string | null };
type Tarea = {
  id: number;
  expediente_id: number;
  titulo: string;
  horas_previstas?: number | null;
  horas_realizadas?: number | null;
  estado?: 'Pendiente' | 'En curso' | 'Completada';
  prioridad?: 'Baja' | 'Media' | 'Alta';
  vencimiento?: string | null;
};

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

async function fetchByCodigo(codigo: string) {
  const supa = getAdmin();
  const { data: exp, error: e1 } = await supa.from('expedientes').select('*').eq('codigo', codigo).maybeSingle();
  if (e1) throw new Error(e1.message);
  if (!exp) throw new Error(`No se encontró el expediente con código ${codigo}`);

  const { data: tareas, error: e2 } = await supa
    .from('tareas')
    .select('*')
    .eq('expediente_id', exp.id)
    .order('vencimiento', { ascending: true, nullsFirst: true });
  if (e2) throw new Error(e2.message);

  return { exp: exp as Expediente, tareas: (tareas ?? []) as Tarea[] };
}

// Server actions para tareas de este expediente
export async function createTaskAction(form: FormData) {
  'use server';
  const supa = getAdmin();
  const payload = {
    expediente_id: Number(form.get('expediente_id')),
    titulo: String(form.get('titulo') ?? ''),
    horas_previstas: Number(form.get('horas_previstas') ?? 0) || 0,
    horas_realizadas: Number(form.get('horas_realizadas') ?? 0) || 0,
    estado: String(form.get('estado') ?? 'Pendiente'),
    prioridad: String(form.get('prioridad') ?? 'Media'),
    vencimiento: String(form.get('vencimiento') ?? '') || null,
  };
  const { error } = await supa.from('tareas').insert(payload);
  if (error) throw new Error(error.message);
}

export async function updateTaskAction(form: FormData) {
  'use server';
  const supa = getAdmin();
  const id = Number(form.get('id'));
  const payload = {
    titulo: String(form.get('titulo') ?? ''),
    horas_previstas: Number(form.get('horas_previstas') ?? 0) || 0,
    horas_realizadas: Number(form.get('horas_realizadas') ?? 0) || 0,
    estado: String(form.get('estado') ?? 'Pendiente'),
    prioridad: String(form.get('prioridad') ?? 'Media'),
    vencimiento: String(form.get('vencimiento') ?? '') || null,
  };
  const { error } = await supa.from('tareas').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteTaskAction(form: FormData) {
  'use server';
  const supa = getAdmin();
  const id = Number(form.get('id'));
  const { error } = await supa.from('tareas').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export default async function Page({ params }: { params: { codigo: string } }) {
  const { exp, tareas } = await fetchByCodigo(params.codigo);

  return (
    <main className="container">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Expediente · {exp.codigo}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/expedientes" className="btn-link">← Volver</Link>
          <NewTaskButton expedienteId={exp.id} />
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Previstas</th>
            <th>Realizadas</th>
            <th>Estado</th>
            <th>Prioridad</th>
            <th>Vencimiento</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tareas.map((t) => (
            <tr key={t.id}>
              <td>{t.titulo}</td>
              <td>{Number(t.horas_previstas ?? 0).toFixed(2)}</td>
              <td>{Number(t.horas_realizadas ?? 0).toFixed(2)}</td>
              <td>{t.estado ?? '—'}</td>
              <td>{t.prioridad ?? '—'}</td>
              <td>{t.vencimiento ?? '—'}</td>
              <td>
                <span style={{ display: 'inline-flex', gap: 6 }}>
                  <EditTaskButton tarea={t} />
                  <DeleteTaskButton id={t.id} />
                </span>
              </td>
            </tr>
          ))}
          {tareas.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: 16 }}>No hay tareas vinculadas.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}

/** Wrappers client para abrir modales con server actions */
function NewTaskButton({ expedienteId }: { expedienteId: number }) {
  return <ClientNewTask expedienteId={expedienteId} action={createTaskAction} />;
}
function EditTaskButton({ tarea }: { tarea: any }) {
  return <ClientEditTask tarea={tarea} action={updateTaskAction} />;
}
function DeleteTaskButton({ id }: { id: number }) {
  return <ClientDeleteTask id={id} action={deleteTaskAction} />;
}

'use client';
import { useState } from 'react';
import Modal from '@/components/Modal';

function ClientNewTask({ expedienteId, action }: { expedienteId: number; action: (fd: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  return (
    <>
      <button aria-label="Nueva tarea" className="icon-btn" onClick={() => setOpen(true)}>➕</button>
      <TaskModal
        open={open}
        onClose={() => setOpen(false)}
        expedienteId={expedienteId}
        initial={null}
        title="Nueva tarea"
        submitting={submitting}
        onSubmit={async (fd) => {
          fd.set('expediente_id', String(expedienteId));
          setSubmitting(true);
          try { await action(fd); } finally { setSubmitting(false); }
        }}
      />
    </>
  );
}

function ClientEditTask({ tarea, action }: { tarea: any; action: (fd: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  return (
    <>
      <button aria-label="Editar tarea" className="icon-btn" onClick={() => setOpen(true)}>✏️</button>
      <TaskModal
        open={open}
        onClose={() => setOpen(false)}
        initial={tarea}
        title="Editar tarea"
        submitting={submitting}
        onSubmit={async (fd) => {
          fd.set('id', String(tarea.id));
          setSubmitting(true);
          try { await action(fd); } finally { setSubmitting(false); }
        }}
      />
    </>
  );
}

function ClientDeleteTask({ id, action }: { id: number; action: (fd: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  return (
    <>
      <button aria-label="Borrar tarea" className="icon-btn" onClick={() => setOpen(true)}>🗑️</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Confirmar borrado">
        <p>¿Seguro que deseas borrar esta tarea?</p>
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
