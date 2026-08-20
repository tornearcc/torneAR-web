"use client";

import { useState, useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { setUserSuspensionAction, updateReportStatusAction } from "@/lib/admin-actions";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/supabase";

type ReportRow = Database["public"]["Tables"]["content_reports"]["Row"];
type ReportStatus = ReportRow["status"];
type ProfileSummary = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "username" | "full_name"
>;

// No extiende ReportRow completo a propósito: el SELECT de la página no trae
// `reporter_id` (trae el embed `reporter` en su lugar), así que este tipo
// tiene que reflejar exactamente esas columnas y no todas las de la tabla.
export interface ModerationReport {
  id: string;
  reported_entity_type: ReportRow["reported_entity_type"];
  reported_entity_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
  reporter: ProfileSummary | null;
  /** Sólo se resuelve para reported_entity_type === 'USER' (ver page.tsx). */
  reportedUser: ProfileSummary | null;
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

/** Las dos mitades del circuito de moderación de cuentas. */
type AccountAction = "suspend" | "unban";

export function ReportsQueue({
  reports,
  suspendedProfileIds,
}: {
  reports: ModerationReport[];
  /**
   * Perfiles denunciados suspendidos AHORA, según `auth.users` (resuelto en el
   * Server Component vía `admin_get_suspension_status`).
   *
   * Llega como array y no como `Set` porque las props que cruzan el borde
   * server→client se serializan en el payload de RSC, y un `Set` no lo es.
   */
  suspendedProfileIds: string[];
}) {
  const [dialog, setDialog] = useState<
    { report: ModerationReport; action: AccountAction } | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  // Sin estado local espejando `reports` ni overrides optimistas: las Server
  // Actions llaman a `revalidatePath`, así que el Server Component vuelve a
  // consultar y estas props llegan ya actualizadas. La versión anterior
  // mantenía dos copias (una lista en `useState` y un mapa de overrides de
  // suspensión) que había que reconciliar a mano con `router.refresh()`.
  const suspended = new Set(suspendedProfileIds);

  function changeStatus(report: ModerationReport, status: ReportStatus) {
    setBusyId(report.id);
    startTransition(async () => {
      const result = await updateReportStatusAction({ reportId: report.id, status });
      setBusyId(null);

      if (result.ok) {
        toast.success(`Denuncia marcada como ${STATUS_LABEL[status].toLowerCase()}.`);
      } else {
        toast.error("No se pudo actualizar", { description: result.error });
      }
    });
  }

  function handleConfirm() {
    if (!dialog) return;
    const { report, action } = dialog;
    const label = report.reportedUser ? `@${report.reportedUser.username}` : report.reported_entity_id;

    startTransition(async () => {
      const result = await setUserSuspensionAction({
        profileId: report.reported_entity_id,
        suspend: action === "suspend",
        reason:
          action === "suspend"
            ? `Denuncia ${report.id} (${label}): ${report.reason}`
            : `Levantamiento de suspensión desde la denuncia ${report.id} (${label})`,
      });

      if (result.ok) {
        setDialog(null);
        toast.success(action === "suspend" ? "Usuario suspendido" : "Suspensión levantada", {
          description: result.message,
        });
      } else {
        toast.error("No se pudo aplicar la acción", { description: result.error });
      }
    });
  }

  if (reports.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Todo al día"
        description="No hay denuncias para revisar."
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-neutral-outline-variant">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
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
            {reports.map((report) => {
              const isSuspended = suspended.has(report.reported_entity_id);
              const busy = isPending && busyId === report.id;

              return (
                <tr
                  key={report.id}
                  className="border-b border-neutral-outline-variant last:border-0"
                >
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        STATUS_BADGE_CLASS[report.status],
                      )}
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
                    {report.reportedUser ? (
                      <span className="text-neutral-on-surface">
                        @{report.reportedUser.username}
                      </span>
                    ) : (
                      <span className="font-mono text-xs">
                        {report.reported_entity_id.slice(0, 8)}…
                      </span>
                    )}
                    {report.reported_entity_type === "USER" && isSuspended ? (
                      <span className="ml-2 rounded-full bg-danger-error-container px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-danger-on-error-container">
                        Suspendido
                      </span>
                    ) : null}
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
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={busy || report.status === "REVIEWED"}
                        onClick={() => changeStatus(report, "REVIEWED")}
                      >
                        Marcar revisado
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        disabled={busy || report.status === "DISMISSED"}
                        onClick={() => changeStatus(report, "DISMISSED")}
                      >
                        Desestimar
                      </Button>

                      {/* Un solo botón que alterna, y no dos en paralelo: los
                          dos estados son mutuamente excluyentes, así que
                          mostrarlos juntos sólo agrega la chance de tocar el
                          equivocado. */}
                      {report.reported_entity_type === "USER" ? (
                        <Button
                          size="xs"
                          disabled={isPending}
                          onClick={() =>
                            setDialog({ report, action: isSuspended ? "unban" : "suspend" })
                          }
                          className={cn(
                            !isSuspended &&
                              "bg-danger-error-container text-danger-on-error-container hover:bg-danger-error-container/85",
                          )}
                        >
                          {isSuspended ? "Levantar suspensión" : "Suspender"}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog?.action === "suspend" ? "¿Suspender usuario?" : "¿Levantar la suspensión?"}
        message={
          dialog ? (
            <>
              <strong className="text-neutral-on-surface">
                {dialog.report.reportedUser
                  ? `@${dialog.report.reportedUser.username}`
                  : dialog.report.reported_entity_id.slice(0, 8)}
              </strong>{" "}
              — denuncia por “{dialog.report.reason}”.
            </>
          ) : (
            ""
          )
        }
        // Fricción en las dos direcciones a propósito. Levantar una suspensión
        // devuelve a la app a alguien que un admin decidió sacar: no es
        // "deshacer", es otra decisión de moderación y merece la misma pausa.
        impact={
          dialog?.action === "suspend"
            ? "El usuario pierde el acceso a la app de inmediato."
            : "El usuario recupera el acceso completo a la app."
        }
        confirmLabel={dialog?.action === "suspend" ? "Suspender" : "Levantar"}
        tone={dialog?.action === "suspend" ? "danger" : "primary"}
        loading={isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
