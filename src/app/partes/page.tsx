import { createClient } from '@supabase/supabase-js';
import ParteModal from '@/components/ParteModal';
import React from 'react';
import Modal from '@/components/Modal';

type ParteRow = {
  id: number;
  fecha: string;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  horas?: number | null;
  comentario?: string | null;
  expedientes?: { id: number; codigo: string } | { id: number; codigo: string }[] | null;
  tareas?: { id: number; titulo: string } | { id: number; titulo: string }[] | null;
};

type ExpedienteRef = { id: number; codigo: string };
type TareaRef = { id: number; titulo: string };

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

function one<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

async function fetchPartes(orden?: string) {
  const supa = getAdmin();
  let query = supa
    .from('partes')
    .select('id, fecha, hora_inicio, hora_fin, horas, comentario, expedientes(id,codigo), tareas(id,titulo)');

  switch (orden) {
    case 'fecha':
      query = query.order('fecha', { ascending: false });
      break;
    case 'horas':
      query = query.order('horas', { ascending: false, nullsFirst: true });
      break;
    default:
      query = query.order('id', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw new Error(`Error al cargar partes: ${error.message}`);
  return (data ?? []) as ParteRow[];
}

async function fetchRefs() {
  const supa = getAdmin();
  const [{ data: exps }, { data: tars }] = await Promise.all([
    supa.from('expedientes').select('id,codigo').order('codigo', { ascending: true }),
    supa.from('tareas').select('id,titulo').order('titulo', { ascending: true }),
  ]);
  return {
    expedientes: (exps ?? []) as ExpedienteRef[],
    tareas: (tars ?? []) as TareaRef[],
  };
}

// server actions
export async function createParteAction(form: FormData) {
  'use server';
  const supa = getAdmin();
  const payload = {
    fecha: String(form.get('fecha') ?? ''),
    horas: Number(form.get('horas') ?? 0) || 0,
    hora_inicio: String(form.get('hora_inicio') ?? '') || null,
    hora_fin: String(form.get('hora_fin') ?? '') || null,
    comentario: String(form.get('comentario') ?? '') || null,
    expediente_id: form.get('expediente_id') ? Number(form.get('expediente_id')) : null,
    tarea_id: form.get('tarea_id') ? Number(form.get('tarea_id')) : null,
  };
  const { error } = await supa.from('partes').insert(payload);
  if (error) throw new Error(error.message);
}

export async function updateParteAction(form: FormData) {
  'use server';
  const supa = getAdmin();
  const id = Number(form.get('id'));
  const payload = {
    fecha: String(form.get('fecha') ?? ''),
    horas: Number(form.get('horas') ?? 0) || 0,
    hora_inicio: String(form.get('hora_inicio') ?? '') || null,
    hora_fin: String(form.get('hora_fin') ?? '') || null,
    comentario: String(form.get('comentario') ?? '') || null,
    expediente_id: form.get('expediente_id') ? Number(form.get('expediente_id')) : null,
    tarea_id: form.get('tarea_id') ? Number(form.get('tarea_id')) : null,
  };
  const { error } = await supa.from('partes').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteParteAction(form: FormData) {
  'use server';
  const supa = getAdmin();
  const id = Number(form.get('id'));
  const { error } = await supa.from('partes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export default async function Page({ searchParams }: { searchParams: any }) {
  const orden = searchParams?.orden ?? 'fecha';
  const [rows, refs] = await Promise.all([fetchPartes(orden), fetchRefs()]);

  return (
    <main className="container">
      <div className="toolbar">
        <form method="get" className="filters">
          <select name="orden" defaultValue={orden} className="input" onChange={(e)=> e.currentTarget.form?.submit()}>
            <option value="fecha">Ordenar: Fecha</option>
            <option value="horas">Ordenar: Horas</option>
            <option value="id">Ordenar: Recientes</option>
          </select>
        </form>
        <CreateParteButton expedientes={refs.expedientes} tareas={refs.tareas} />
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Horas</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Expediente</th>
            <th>Tarea</th>
            <th>Comentario</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const exp = one(p.expedientes);
            const tar = one(p.tareas);
            return (
              <tr key={p.id}>
                <td>{p.fecha}</td>
                <td>{Number(p.horas ?? 0).toFixed(2)}</td>
                <td>{p.hora_inicio ?? '—'}</td>
                <td>{p.hora_fin ?? '—'}</td>
                <td>{exp?.codigo ?? '—'}</td>
                <td>{tar?.titulo ?? '—'}</td>
                <td>{p.comentario ?? ''}</td>
                <td>
                  <span style={{ display: 'inline-flex', gap: 6 }}>
                    <EditParteButton parte={p} expedientes={refs.expedientes} tareas={refs.tareas} />
                    <DeleteParteButton id={p.id} />
                  </span>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: 16 }}>No hay partes.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}

/** Wrappers client para control de modales */
function CreateParteButton({ expedientes, tareas }: { expedientes: ExpedienteRef[]; tareas: TareaRef[] }) {
  return <ClientCreateParte expedientes={expedientes} tareas={tareas} />;
}
function EditParteButton({ parte, expedientes, tareas }: { parte: any; expedientes: ExpedienteRef[]; tareas: TareaRef[] }) {
  return <ClientEditParte parte={parte} expedientes={expedientes} tareas={tareas} />;
}
function DeleteParteButton({ id }: { id: number }) {
  return <ClientDeleteParte id={id} />;
}

'use client';
import { useState } from 'react';

function ClientCreateParte({ expedientes, tareas }: { expedientes: ExpedienteRef[]; tareas: TareaRef[] }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  return (
    <>
      <button aria-label="Nuevo parte" className="icon-btn" onClick={() => setOpen(true)}>➕</button>
      <ParteModal
        open={open}
        onClose={() => setOpen(false)}
        initial={null}
        expedientes={expedientes}
        tareas={tareas}
        submitting={submitting}
        onSubmit={async (fd) => {
          setSubmitting(true);
          try { await createParteAction(fd); } finally { setSubmitting(false); }
        }}
      />
    </>
  );
}

function ClientEditParte({
  parte, expedientes, tareas,
}: {
  parte: any; expedientes: ExpedienteRef[]; tareas: TareaRef[];
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  return (
    <>
      <button aria-label="Editar parte" className="icon-btn" onClick={() => setOpen(true)}>✏️</button>
      <ParteModal
        open={open}
        onClose={() => setOpen(false)}
        initial={{
          id: parte.id,
          fecha: parte.fecha,
          hora_inicio: parte.hora_inicio ?? '',
          hora_fin: parte.hora_fin ?? '',
          horas: parte.horas ?? 0,
          comentario: parte.comentario ?? '',
          expediente_id: (Array.isArray(parte.expedientes) ? parte.expedientes[0]?.id : parte.expedientes?.id) ?? undefined,
          tarea_id: (Array.isArray(parte.tareas) ? parte.tareas[0]?.id : parte.tareas?.id) ?? undefined,
        }}
        expedientes={expedientes}
        tareas={tareas}
        submitting={submitting}
        onSubmit={async (fd) => {
          fd.set('id', String(parte.id));
          setSubmitting(true);
          try { await updateParteAction(fd); } finally { setSubmitting(false); }
        }}
      />
    </>
  );
}

function ClientDeleteParte({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  return (
    <>
      <button aria-label="Borrar parte" className="icon-btn" onClick={() => setOpen(true)}>🗑️</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Confirmar borrado">
        <p>¿Seguro que deseas borrar este parte?</p>
        <form
          action={async (fd) => {
            fd.set('id', String(id));
            setSubmitting(true);
            try { await deleteParteAction(fd); } finally { setSubmitting(false); }
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
