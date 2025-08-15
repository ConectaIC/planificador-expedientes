// src/components/ErrorState.tsx
type Props = {
  /** Mensaje de error amigable para el usuario */
  mensaje: string;
};

export default function ErrorState({ mensaje }: Props) {
  const box: React.CSSProperties = {
    border: '1px solid var(--cic-danger-border, #f5c2c7)',
    background: 'var(--cic-danger-bg, #fff5f5)',
    color: 'var(--cic-danger-text, #b42318)',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  };
  const strong: React.CSSProperties = { fontWeight: 700 };

  return (
    <div style={box} role="alert" aria-live="assertive">
      <span style={strong}>Error:</span> {mensaje}
    </div>
  );
}
