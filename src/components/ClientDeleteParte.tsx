// src/components/ClientDeleteParte.tsx
'use client';

type Props = {
  id: number;
  onDelete: (id: number) => Promise<{ ok: boolean; error?: string } | void>;
};

export default function ClientDeleteParte({ id, onDelete }: Props) {
  return (
    <button
      className="icon-btn"
      title="Borrar parte"
      onClick={async () => {
        if (!confirm('¿Borrar este parte?')) return;
        await onDelete(id);
      }}
    >
      🗑️
    </button>
  );
}
