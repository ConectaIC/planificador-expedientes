// src/components/ClientDeleteTask.tsx
'use client';

type Props = {
  id: number;
  action: (id: number) => Promise<{ ok: boolean; error?: string } | void>;
};

export default function ClientDeleteTask({ id, action }: Props) {
  return (
    <button
      className="icon-btn"
      title="Borrar tarea"
      onClick={async () => {
        const ok = confirm('¿Borrar esta tarea?');
        if (!ok) return;
        await action(id);
      }}
    >
      🗑️
    </button>
  );
}
