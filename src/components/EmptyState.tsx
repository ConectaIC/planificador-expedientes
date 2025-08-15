// src/components/EmptyState.tsx
type Props = {
  /** Mensaje a mostrar (ej.: "No hay datos disponibles") */
  mensaje: string;
  /** Texto pequeño opcional debajo del mensaje principal */
  detalle?: string;
};

export default function EmptyState({ mensaje, detalle }: Props) {
  const box: React.CSSProperties = {
    border: '1px dashed var(--cic-border, #d9d9d9)',
    background: 'var(--cic-bg-muted, #fafafa)',
    borderRadius: 8,
    padding: 16,
    textAlign: 'center',
    color: 'var(--cic-text-muted, #666)',
    marginTop: 12,
  };
  const title: React.CSSProperties = { fontWeight: 600 };
  const small: React.CSSProperties = { marginTop: 4, fontSize: '.9rem', opacity: 0.8 };

  return (
    <div style={box} role="status" aria-live="polite">
      <div style={title}>{mensaje}</div>
      {detalle ? <div style={small}>{detalle}</div> : null}
    </div>
  );
}
