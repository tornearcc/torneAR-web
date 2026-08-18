"use client";

import { useState } from "react";
import type { Database } from "@/types/supabase";

type ReportRow = Database["public"]["Tables"]["content_reports"]["Row"];
type ReportStatus = ReportRow["status"];
type ProfileSummary = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "username" | "full_name"
>;

// No extiende ReportRow completo a propósito: el SELECT de la página no
// trae `reporter_id` (trae el embed `reporter` en su lugar), así que este
// tipo tiene que reflejar exactamente esas columnas y no todas las de la
// tabla.
export interface ModerationReport {
  id: string;
  reported_entity_type: ReportRow["reported_entity_type"];
  reported_entity_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
  reporter: ProfileSummary | null;
}

const STATUS_LABEL: Record<ReportStatus, string> = {
  PENDING: "Pendiente",
  REVIEWED: "Revisado",
  DISMISSED: "Desestimado",
  ACTIONED: "Accionado",
};

const STATUS_BADGE_CLASS: Record<ReportStatus, string> = {
  PENDING: "bg-warning-tertiary-container text-warning-on-tertiary",
  REVIEWED: "bg-info-secondary-container text-info-on-secondary",
  DISMISSED: "bg-surface-high text-neutral-on-surface-variant",
  ACTIONED: "bg-brand-primary-container text-brand-inverse-primary",
};

const ENTITY_LABEL: Record<ReportRow["reported_entity_type"], string> = {
  USER: "Usuario",
  MATCH: "Partido",
};

export function ReportsQueue({ reports }: { reports: ModerationReport[] }) {
  const [items, setItems] = useState(reports);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  async function updateStatus(id: string, status: ReportStatus) {
    setPendingId(id);
    setErrorId(null);

    const res = await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setPendingId(null);

    if (!res.ok) {
      setErrorId(id);
      return;
    }

    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-outline-variant bg-surface-container p-8 text-center text-neutral-on-surface-variant">
        No hay denuncias todavía.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-outline-variant">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-outline-variant bg-surface-container text-neutral-on-surface-variant">
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Denunciante</th>
            <th className="px-4 py-3 font-medium">Entidad</th>
            <th className="px-4 py-3 font-medium">Motivo</th>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((report) => (
            <tr
              key={report.id}
              className="border-b border-neutral-outline-variant last:border-0"
            >
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[report.status]}`}
                >
                  {STATUS_LABEL[report.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-neutral-on-surface">
                {report.reporter ? `@${report.reporter.username}` : "—"}
              </td>
              <td className="px-4 py-3 text-neutral-on-surface-variant">
                <span className="font-medium text-neutral-on-surface">
                  {ENTITY_LABEL[report.reported_entity_type]}
                </span>{" "}
                <span className="font-mono text-xs">
                  {report.reported_entity_id.slice(0, 8)}…
                </span>
              </td>
              <td className="max-w-xs px-4 py-3 text-neutral-on-surface-variant">
                {report.reason}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-on-surface-variant">
                {new Date(report.created_at).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pendingId === report.id || report.status === "REVIEWED"}
                    onClick={() => updateStatus(report.id, "REVIEWED")}
                    className="rounded-md border border-neutral-outline px-2.5 py-1 text-xs font-semibold text-neutral-on-surface transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Marcar revisado
                  </button>
                  <button
                    type="button"
                    disabled={pendingId === report.id || report.status === "DISMISSED"}
                    onClick={() => updateStatus(report.id, "DISMISSED")}
                    className="rounded-md border border-neutral-outline px-2.5 py-1 text-xs font-semibold text-neutral-on-surface-variant transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Desestimar
                  </button>
                </div>
                {errorId === report.id && (
                  <p className="mt-1 text-xs text-danger-error">No se pudo actualizar.</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
