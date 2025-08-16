export default function Home() {
  return (
    <div className="hero">
      <div className="hero-card">
        <h1 className="hero-title">Bienvenido/a</h1>
        <p className="hero-sub">Accede rápidamente a los módulos principales</p>
        <div className="actions">
          <a className="action-btn" href="/expedientes" aria-label="Expedientes">
            <span className="action-emoji">📁</span> Expedientes
          </a>
          <a className="action-btn" href="/tareas" aria-label="Tareas">
            <span className="action-emoji">✅</span> Tareas
          </a>
          <a className="action-btn" href="/partes" aria-label="Partes">
            <span className="action-emoji">🧾</span> Partes
          </a>
        </div>
      </div>
    </div>
  );
}
