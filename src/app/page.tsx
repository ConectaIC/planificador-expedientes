export default function Home() {
  return (
    <main style={{ display: 'grid', gap: 16 }}>
      <h2>Panel</h2>

      <p>Accesos rápidos:</p>
      <ul style={{ lineHeight: 1.8 }}>
        <li><a href="/expedientes">Expedientes</a></li>
        <li><a href="/partes">Imputación de horas</a></li>
        <li><a href="/resumen">Resumen para asistente</a></li>
      </ul>
    </main>
  );
}
