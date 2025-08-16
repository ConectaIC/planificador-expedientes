// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Gestión y Planificador - Conecta Ingenieros Civiles",
  description: "Planificador de expedientes, tareas y partes - CIC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <NavBar />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
