// src/components/ClientTaskActions.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';

type Tarea = {
  id: number;
  expediente_id: number;
  titulo: string;
  horas_previstas: number | null;
  horas_realizadas: number | null;
  estado: 'Pendiente' | 'En curso' | 'Completada' | null;
  prioridad: 'Baja' | 'Media' | 'Alta' | null;
  vencimiento: string | null;
};
type ExpedienteMini = { id: number; codigo: string; proyecto: string };

export default function ClientTaskActions({
  tarea,
  expedientes,
  updateAction,
  deleteAction,
}: {
  tarea: Tarea;
  expedientes: ExpedienteMini[];
  updateAction: (fd: FormData) => Promise<void>;
  deleteAction: (fd: FormData) => Promise<void>;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      {/* Editar */}
      <button className="btn-icon" aria-label="Editar tarea" onClick={() => setEditOpen(true)}>✏️</button>
      {/* Borrar */}
      <button className="btn-icon" aria-label="Borrar tarea" onClick={() => setDelOpen(true)}>🗑️</button>

      {editOpen && (
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar tarea">
          <form action={async (fd) => { 
            fd.set('id', String(tarea.id));
            await updateAction(fd); 
            setEditOpen(false); 
            router.refresh(); 
          }} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Título</label>
              <input name="titulo" defaultValue={tarea.titulo} className="input" required />
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="block text-sm mb-1">Horas previstas</label>
                <input type="number" step="0.25" min="0" name="horas_previstas" defaultValue={tarea.horas_previstas ?? undefined} className="input" />
              </div>
              <div>
                <label className="block text-sm mb-1">Vencimiento</label>
                <input type="date" name="vencimiento" defaultValue={tarea.vencimiento ?? undefined} className="input" />
              </div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="block text-sm mb-1">Estado</label>
                <select name="estado" defaultValue={tarea.estado ?? 'Pendiente'} className="input">
                  <option value="Pendiente">Pendiente</option>
                  <option value="En curso">En curso</option>
                  <option value="Completada">Completada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Prioridad</label>
                <select name="prioridad" defaultValue={tarea.prioridad ?? 'Media'} className="input">
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" className="btn" onClick={() => setEditOpen(false)}>✖</button>
              <button type="submit" className="btn-primary">💾</button>
            </div>
          </form>
        </Modal>
      )}

      {delOpen && (
        <Modal open={delOpen} onClose={() => setDelOpen(false)} title="Confirmar borrado">
          <form action={async (fd) => { 
            fd.set('id', String(tarea.id));
            await deleteAction(fd); 
            setDelOpen(false); 
            router.refresh(); 
          }}>
            <p className="mb-4">¿Seguro que quieres borrar <strong>{tarea.titulo}</strong>?</p>
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn" onClick={() => setDelOpen(false)}>✖</button>
              <button type="submit" className="btn-danger">🗑️</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
