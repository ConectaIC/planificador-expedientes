// src/components/TableEmptyRow.tsx
type Props = {
  colSpan: number;
  /** Mensaje a mostrar. Por defecto '—' */
  mensaje?: string;
};

export default function TableEmptyRow({ colSpan, mensaje = '—' }: Props) {
  const td: React.CSSProperties = {
    borderBottom: '1px solid var(--cic-border, #f0f0f0)',
    padding: '8px 6px',
    textAlign: 'center',
    opacity: 0.7,
  };
  return (
    <tr>
      <td colSpan={colSpan} style={td}>
        {mensaje}
      </td>
    </tr>
  );
}
