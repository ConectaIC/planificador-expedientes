"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";

type ExpedienteRef = { id: number; codigo: string; proyecto?: string | null };
type TareaRef = { id: number; titulo: string };

export type ParteDTO = {
  id: number | string;
  fecha: string;           // "YYYY-MM-DD"
  hora_inicio: string;     // "HH:MM" o "HH:MM:SS"
  hora_fin: string;        // idem
  comentario?: string | null;
  expediente_id?: number | null;
  tarea_id?: number | null;
};

export type EditPartePayload = Omit<ParteDTO, "hora_inicio" | "hora_fin"> & {
  hora_inicio: string;     // "HH:MM"
  hora_fin: string;        // "HH:MM"
};

function hhmm(v?: string | null) {
  if (!v) return "";
  // convierte "HH:MM:SS" -> "HH:MM"
  const [h, m] = v.split(":");
  if (!h || !m) return v;
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

function roundToQuarter(value: string) {
  if (!value) return value;
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const quarters = [0, 15, 30, 45];
  const nearest = quarters.reduce((a, b) =>
    Math.abs(b - m) < Math.abs(a - m) ? b : a
  );
  const hh = String(h).padStart(2, "0");
  const mm = String(nearest).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function EditParteModal({
  open,
  onClose,
  parte,
  expedientes,
  tareas,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  parte: ParteDTO;
  expedientes: ExpedienteRef[];
  tareas: TareaRef[];
  onSave: (p: EditPartePayload) => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [fecha, setFecha] = useState<string>(parte.fecha);
  const [horaInicio, setHoraInicio] = useState<string>(hhmm(parte.hora_inicio));
  const [horaFin, setHoraFin] = useState<string>(hhmm(parte.hora_fin));
  const [comentario, setComentario] = useState<string>(parte.comentario || "");
  const [expedienteId, setExpedienteId] = useState<number | "">(
    parte.expediente_id ?? ""
  );
  const [tareaId, setTareaId] = useState<number | "">(
    parte.tarea_id ?? ""
  );

  useEffect(() => {
    // cuando cambie el parte que entra por props, sincroniza estado
    setFecha(parte.fecha);
    setHoraInicio(hhmm(parte.hora_inicio));
    setHoraFin(hhmm(parte.hora_fin));
    setComentario(parte.comentario || "");
    setExpedienteId(parte.expediente_id ?? "");
    setTareaId(parte.tarea_id ?? "");
  }, [parte]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      setErr(null);

      const hi = roundToQuarter(horaInicio);
      const hf = roundToQuarter(horaFin);

      if (!fecha) throw new Error("La fecha es obligatoria");
      if (!hi) throw new Error("La hora de inicio es obligatoria");
      if (!hf) throw new Error("La hora de fin es obligatoria");

      await onSave({
        id: parte.id,
        fecha,
        hora_inicio: hi,
        hora_fin: hf,
        comentario: comentario?.trim() || "",
        expediente_id: expedienteId === "" ? null : Number(expedienteId),
        tarea_id: tareaId === "" ? null : Number(tareaId),
      });

      setBusy(false);
      onClose();
    } catch (e: any) {
      setBusy(false);
      setErr(e?.message || "Error al guardar el parte");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Editar parte`}>
      <form onSubmit={submit} className="space-y-3">
        {err ? (
          <div className="text-red-600 text-sm border border-red-200 rounded p-2 bg-red-50">
            {err}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 col-span-2 sm:col-span-1">
            <span>Fecha*</span>
            <input
              type="date"
              name="fecha"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="input"
            />
          </label>

          <label className="flex flex-col gap-1 col-span-1">
            <span>Hora inicio*</span>
            <input
              type="time"
              name="hora_inicio"
              required
              step={900}
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              onBlur={(e) =>
                setHoraInicio(roundToQuarter(e.currentTarget.value))
              }
              className="input"
            />
          </label>

          <label className="flex flex-col gap-1 col-span-1">
            <span>Hora fin*</span>
            <input
              type="time"
              name="hora_fin"
              required
              step={900}
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              onBlur={(e) => setHoraFin(roundToQuarter(e.currentTarget.value))}
              className="input"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span>Expediente</span>
          <select
            name="expediente_id"
            value={expedienteId}
            onChange={(e) =>
              setExpedienteId(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            className="select"
          >
            <option value="">— Sin expediente —</option>
            {expedientes.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.codigo}
                {ex.proyecto ? ` — ${ex.proyecto}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span>Tarea (opcional)</span>
          <select
            name="tarea_id"
            value={tareaId}
            onChange={(e) =>
              setTareaId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="select"
          >
            <option value="">— Sin tarea —</option>
            {tareas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.titulo}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span>Descripción</span>
          <textarea
            name="comentario"
            rows={3}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="textarea"
            placeholder="Descripción breve del trabajo…"
          />
        </label>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            disabled={busy}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
