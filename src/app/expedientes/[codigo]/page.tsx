// src/app/expedientes/[codigo]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";

// ---- Tipos base según tu esquema ----
type Prioridad = "Baja" | "Media" | "Alta";
type EstadoExp =
  | "Pendiente"
  | "En curso"
  | "En supervisión"
  | "Entregado"
  | "Cerrado";
type EstadoTarea = "Pendiente" | "En curso" | "Completada";

interface Expediente {
  id: number;
  codigo: string;
  proyecto: string | null;
  cliente: string | null;
  inicio: string | null; // date
  fin: string | null; // date
  prioridad: Prioridad | null;
  estado: EstadoExp | null;
  horas_previstas: number | null;
  horas_reales: number | null;
}

interface Tarea {
  id: number;
  expediente_id: number;
  titulo: string;
  horas_previstas: number | null;
  horas_realizadas: number | null;
  estado: EstadoTarea;
  prioridad: Prioridad | null;
  vencimiento: string | null; // date
}

// ---- Carga de datos (SSR) ----
async function fetchExpedienteYtareas(codigo: string) {
  const supabase = createClient();

  // 1) Expediente por código
  const { data: expData, error: e1 } = await supabase
    .from("expedientes")
    .select(
      "id, codigo, proyecto, cliente, inicio, fin, prioridad, estado, horas_previstas, horas_reales"
    )
    .eq("codigo", codigo)
    .maybeSingle();

  if (e1) {
    throw new Error(`Error al cargar expediente: ${e1.message}`);
  }
  if (!expData) {
    // No existe ese código
    return { expediente: null as unknown as Expediente, tareas: [] as Tarea[] };
  }

  // Tipamos el expediente explícitamente para evitar 'unknown'
  const expediente = expData as Expediente;

  // 2) Tareas del expediente
  const { data: tareasData, error: e2 } = await supabase
    .from("tareas")
    .select(
      "id, expediente_id, titulo, horas_previstas, horas_realizadas, estado, prioridad, vencimiento"
    )
    // 👇 fuerza el tipo numérico para que TS no marque 'unknown'
    .eq("expediente_id", Number(expediente.id))
    .order("vencimiento", { ascending: true });

  if (e2) {
    throw new Error(`Error al cargar tareas: ${e2.message}`);
  }

  const tareas = (tareasData || []) as Tarea[];
  return { expediente, tareas };
}

// ---- Page (Server Component) ----
export default async function ExpedienteDetallePage({
  params,
}: {
  params: { codigo: string };
}) {
  const codigo = decodeURIComponent(params.codigo);
  const { expediente, tareas } = await fetchExpedienteYtareas(codigo);

  if (!expediente || !expediente.id) {
    notFound();
  }

  const fmtNum = (n: number | null | undefined) =>
    Number.isFinite(Number(n)) ? Number(n).toFixed(2) : "—";
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString() : "—";

  return (
    <main className="container">
      <div
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h2>
          Expediente · <span style={{ fontWeight: 600 }}>{codigo}</span>
        </h2>

        {/* Si tienes un modal cliente para crear tareas, puedes importarlo aquí */}
        {/* <NewTareaModal expedienteId={expediente.id} /> */}
        <Link href="/expedientes" className="btn-link">
          ⟵ Volver
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Información</h3>
        <div className="responsive-grid-2">
          <div>
            <div>
              <strong>Proyecto:</strong> {expediente.proyecto ?? "—"}
            </div>
            <div>
              <strong>Cliente:</strong> {expediente.cliente ?? "—"}
            </div>
            <div>
              <strong>Inicio:</strong> {fmtDate(expediente.inicio)}
            </div>
            <div>
              <strong>Fin:</strong> {fmtDate(expediente.fin)}
            </div>
          </div>
          <div>
            <div>
              <strong>Prioridad:</strong> {expediente.prioridad ?? "—"}
            </div>
            <div>
              <strong>Estado:</strong> {expediente.estado ?? "—"}
            </div>
            <div>
              <strong>Horas previstas:</strong> {fmtNum(expediente.horas_previstas ?? 0)}
            </div>
            <div>
              <strong>Horas reales:</strong> {fmtNum(expediente.horas_reales ?? 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <h3>Tareas vinculadas</h3>

          {/* Si tienes botón/modal cliente de “+ Nueva tarea”: */}
          {/* <NewTareaModal expedienteId={expediente.id} /> */}
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: "32px" }}>#</th>
                <th>Título</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Vencimiento</th>
                <th>Horas prev.</th>
                <th>Horas real.</th>
                <th style={{ textAlign: "center", width: 90 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tareas.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 16 }}>
                    No hay tareas vinculadas todavía.
                  </td>
                </tr>
              ) : (
                tareas.map((t, idx) => (
                  <tr key={t.id}>
                    <td>{idx + 1}</td>
                    <td>{t.titulo}</td>
                    <td>{t.estado}</td>
                    <td>{t.prioridad ?? "—"}</td>
                    <td>{fmtDate(t.vencimiento)}</td>
                    <td>{fmtNum(t.horas_previstas ?? 0)}</td>
                    <td>{fmtNum(t.horas_realizadas ?? 0)}</td>
                    <td style={{ textAlign: "center" }}>
                      {/* Sustituye por tus modales cliente si ya existen */}
                      {/* <EditTareaModal tarea={t} /> */}
                      {/* <DeleteTareaDialog id={t.id} /> */}
                      <span style={{ opacity: 0.5 }}>✏️ 🗑️</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
