// src/components/NavBar.tsx
import Link from "next/link";
import Image from "next/image";

export default function NavBar() {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link href="/" className="brand" prefetch={false}>
          <span className="brand__logo">
            <Image
              src="/logo.png" // si tu logo es otro archivo, ajusta este path
              alt="CIC"
              width={120}
              height={40}
              priority
            />
          </span>
          <span className="brand__text">
            CIC · Conecta Ingenieros Civiles
          </span>
        </Link>

        <nav className="nav">
          <Link href="/" className="nav__item" prefetch={false}>Inicio</Link>
          <Link href="/expedientes" className="nav__item" prefetch={false}>Expedientes</Link>
          <Link href="/tareas" className="nav__item" prefetch={false}>Tareas</Link>
          <Link href="/partes" className="nav__item" prefetch={false}>Partes</Link>
          <Link href="/resumen" className="nav__item" prefetch={false}>Resumen</Link>
        </nav>
      </div>
    </header>
  );
}
