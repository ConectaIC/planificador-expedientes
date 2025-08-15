// src/components/TareasDeExpedienteModal.tsx
'use client';

import React from 'react';
import Modal from './Modal';
import TareaForm from './TareaForm';
import ConfirmModal from './ConfirmModal';
import { deleteTarea } from '../app/tareas/actions';

type Expediente = { id: number; codigo: string; proyecto?: string | null };
type Tarea = {
  id: number; titulo: string; expediente_id: number;
  vencimiento?: string | null; estado?: string | null; tipo?: string | null;
  horas_previstas?: number | null;
};

type Props = {
  expediente: Expediente;
  expedientes: Expediente[];
  tareas: Tarea[];               // todas las tareas; filtramos por expediente_id
  onChanged?: () => void;        // para refrescar lista tras crear/editar/borrar
};

export default function TareasDeExpedienteModal({ expediente, expedientes, tareas, onChanged }: Props) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<'list' | 'new' | 'edit'>('list');
  const [sel, setSel] = React.useState<Tarea | null>(null);
  const [confirm, setConfirm] = React.useState<{ open: boolean; id?: number }>({ open: false });

  const list = React.useMemo(() => tareas.filter(t => t.expediente_id === expediente.id), [tareas, expediente.id]);

  const btn: React.CSSProperties = {
    padding: '6px 10px', borderRadius: 8, border: '1px solid var(--cic-border, #dcdcdc)',
    background: 'var(--cic-bg, #f7f7f7)', cursor: 'pointer'
  };

  const openNew = () => { setSel(null); setMode('new'); };
  const openEdit = (t: Tarea) => { setSel(t); setMode('edit'); };
  const backToList = () => { setMode('list'); onChanged?.(); };

  const onDelete = async () => {
    if (!confirm.id) return;
    const res = await deleteTarea(confirm.id);
    setConfirm({ open: false });
    if (res.ok) onChanged?.();
    // si hay error, podríamos mostrarlo, pero mantenemos UI simple
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={btn}>Tareas…</button>

      <Modal open={open} onClose={() => { setOpen(false); setMode('list'); }} title={`Tareas — ${expediente.codigo}`}>
        {mode === 'list' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button type="button" onClick={openNew} style={btn}>+ Nueva tarea</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: '6px' }}>Título</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: '6px' }}>Vencimiento</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: '6px' }}>Estado</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: '6px' }}>Tipo</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: '6px' }}>Horas prev.</th>
                  <th style={{ borderBottom: '1px solid #eee', padding: '6px' }} />
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id}>
                    <td style={{ borderBottom: '1px solid #f2f2f2', padding: '6px' }}>{t.titulo}</td>
                    <td style={{ borderBottom: '1px solid #f2f2f2', padding: '6px' }}>{t.vencimiento || '—'}</td>
                    <td style={{ borderBottom: '1px solid #f2f2f2', padding: '6px' }}>{t.estado || '—'}</td>
                    <td style={{ borderBottom: '1px solid #f2f2f2', padding: '6px' }}>{t.tipo || '—'}</td>
                    <td style={{ borderBottom: '1px solid #f2f2f2', padding: '6px' }}>{t.horas_previstas ?? '—'}</td>
                    <td style={{ borderBottom: '1px solid #f2f2f2', padding: '6px', textAlign: 'right' }}>
                      <button type="button" onClick={() => openEdit(t)} style={btn}>Editar</button>{' '}
                      <button type="button" onClick={() => setConfirm({ open: true, id: t.id })} style={btn}>Borrar</button>
                    </td>
                  </tr>
                ))}
                {!list.length && (
                  <tr>
                    <td colSpan={6} style={{ padding: 8, textAlign: 'center', opacity: .7 }}>No hay tareas para este expediente.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {mode === 'new' && (
          <>
            <TareaForm expedientes={expedientes} onSaved={backToList} />
            <div style={{ marginTop: 8 }}>
              <button type="button" onClick={backToList} style={btn}>Volver</button>
            </div>
          </>
        )}

        {mode === 'edit' && sel && (
          <>
            <TareaForm expedientes={expedientes} initial={sel} onSaved={backToList} />
            <div style={{ marginTop: 8 }}>
              <button type="button" onClick={backToList} style={btn}>Volver</button>
            </div>
          </>
        )}
      </Modal>

      <ConfirmModal
        open={confirm.open}
        onCancel={() => setConfirm({ open: false })}
        onConfirm={onDelete}
        message="¿Seguro que deseas eliminar esta tarea? Esta acción no se puede deshacer."
      />
    </>
  );
}
