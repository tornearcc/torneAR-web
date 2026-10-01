"use client";

import { useState, useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  removeReportedAvatarAction,
  removeReportedContentAction,
  setUserSuspensionAction,
  updateReportStatusAction,
} from "@/lib/admin-actions";
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
  /**
   * Copia del texto denunciado, congelada al momento de la denuncia por
   * `submit_content_report`. Es `null` en las denuncias anteriores a la
   * migración 20260911150000, que se hicieron con el INSERT directo.
   */
  content_snapshot: string | null;
  /**
   * Autor del contenido, resuelto por el servidor. Es a quien se suspende si
   * la denuncia prospera. `null` para MATCH y TEAM, que no tienen autor único,
   * y para las denuncias viejas.
   */
  reportedUser: ProfileSummary | null;
}

/**
 * Tipos sobre los que la RPC sabe eliminar contenido.
 *
 * USER y MATCH quedan afuera porque no hay «contenido» que sacar: ahí la
 * medida es suspender la cuenta. La RPC lo rechaza igual, pero ofrecer un
 * botón que siempre falla es peor que no ofrecerlo.
 */
const REMOVABLE_ENTITY_TYPES: ReadonlySet<ReportRow["reported_entity_type"]> = new Set([
  "MESSAGE",
  "MARKET_TEAM_POST",
  "MARKET_PLAYER_POST",
  "TEAM",
]);

const STATUS_LABEL: Record<ReportStatus, string> = {
  PENDING: "Pendiente",
  REVIEWED: "Revisado",
  DISMISSED: "Desestimado",
  ACTIONED: "Accionado",
};

const STATUS_BADGE_CLASS: Record<ReportStatus, string> = {
  // Sólo la pendiente lleva color: es la única que pide algo (amarilla).
  PENDING: "bg-card-yellow text-on-card",
  REVIEWED: "border border-chalk-line text-chalk-dim",
  DISMISSED: "border border-chalk-line text-chalk-faint",
  ACTIONED: "border border-chalk-line text-chalk",
};

const ENTITY_LABEL: Record<ReportRow["reported_entity_type"], string> = {
  USER: "Usuario",
  MATCH: "Partido",
  MESSAGE: "Mensaje",
  MARKET_TEAM_POST: "Oferta de equipo",
  MARKET_PLAYER_POST: "Oferta de jugador",
  TEAM: "Equipo",
};

/** Las dos mitades del circuito de moderación de cuentas. */
type AccountAction = "suspend" | "unban";

/**
 * Eliminar contenido es la tercera medida, y la única irreversible. En una
 * denuncia de perfil, el contenido es la foto: "remove-avatar".
 */
type ModerationAction = AccountAction | "remove" | "remove-avatar";

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
    { report: ModerationReport; action: ModerationAction } | null
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

    if (action === "remove-avatar") {
      startTransition(async () => {
        const result = await removeReportedAvatarAction({ reportId: report.id });

        if (result.ok) {
          setDialog(null);
          toast.success("Foto quitada", { description: result.message });
        } else {
          // El diálogo se cierra igual: la denuncia sigue pendiente y el mismo
          // botón retoma desde donde se cortó (el mensaje lo dice).
          setDialog(null);
          toast.error("No se pudo completar", { description: result.error, duration: 12000 });
        }
      });
      return;
    }

    if (action === "remove") {
      startTransition(async () => {
        const result = await removeReportedContentAction({ reportId: report.id });

        if (result.ok) {
          setDialog(null);
          toast.success("Contenido eliminado", { description: result.message });
        } else {
          toast.error("No se pudo eliminar", { description: result.error });
        }
      });
      return;
    }

    startTransition(async () => {
      const result = await setUserSuspensionAction({
        profileId: report.reportedUser?.id ?? report.reported_entity_id,
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
      <div className="overflow-x-auto">
        <table className="ledger-stack w-full border-collapse text-left text-[15px] md:min-w-[900px]">
          <thead>
            <tr className="border-b border-chalk-line text-[13px] text-chalk-faint">
              <th className="px-3 py-2 font-normal">Estado</th>
              <th className="px-3 py-2 font-normal">Denunciante</th>
              <th className="px-3 py-2 font-normal">Entidad</th>
              <th className="px-3 py-2 font-normal">Contenido denunciado</th>
              <th className="px-3 py-2 font-normal">Motivo</th>
              <th className="px-3 py-2 font-normal">Fecha</th>
              <th className="px-3 py-2 font-normal">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              // El sujeto de la suspensión es el AUTOR del contenido, que para
              // una denuncia de perfil coincide con la entidad denunciada pero
              // para un mensaje o una oferta no.
              const isSuspended = report.reportedUser
                ? suspended.has(report.reportedUser.id)
                : false;
              const busy = isPending && busyId === report.id;

              return (
                <tr
                  key={report.id}
                  className="border-b border-chalk-line"
                >
                  <td data-label="Estado" className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-block rounded-[4px] px-2 py-0.5 text-[13px] font-medium",
                        STATUS_BADGE_CLASS[report.status],
                      )}
                    >
                      {STATUS_LABEL[report.status]}
                    </span>
                  </td>
                  <td data-label="Denunciante" className="px-3 py-3 text-chalk">
                    {report.reporter ? `@${report.reporter.username}` : "—"}
                  </td>
                  <td data-label="Denunciado" className="px-3 py-3 text-chalk-dim">
                    {/* Un solo hijo: en el celular la celda es una grilla de dos
                        columnas y cada hijo suelto ocuparía una fila. */}
                    <div>
                    <span className="font-medium text-chalk">
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
                    {isSuspended ? (
                      <span className="ml-2 rounded-[4px] bg-card-red px-1.5 py-0.5 text-xs font-medium text-white">
                        Suspendido
                      </span>
                    ) : null}
                    </div>
                  </td>
                  {/* El texto denunciado, no sólo su id. Es lo que vuelve la
                      cola accionable de un vistazo: sin esto hay que salir a
                      buscar el contenido a mano, con 24 horas de plazo encima. */}
                  <td data-label="Contenido" className="max-w-sm px-3 py-3 text-chalk-dim">
                    {report.content_snapshot ? (
                      <span className="line-clamp-3 whitespace-pre-wrap break-words italic">
                        “{report.content_snapshot}”
                      </span>
                    ) : (
                      // Las denuncias anteriores a la migración 20260911150000
                      // se guardaron sin copia del texto.
                      <span className="text-xs text-neutral-outline">Sin copia guardada</span>
                    )}
                  </td>
                  <td data-label="Motivo" className="max-w-xs px-3 py-3 text-chalk-dim">
                    {report.reason}
                  </td>
                  <td data-label="Fecha" className="whitespace-nowrap px-3 py-3 text-chalk-dim">
                    {new Date(report.created_at).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      timeZone: "America/Argentina/Buenos_Aires",
                    })}
                  </td>
                  <td className="px-3 py-3">
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
                      {/* Eliminar el contenido y suspender la cuenta son las
                          dos medidas que pide la guideline 1.2, y son
                          independientes: se puede sacar una publicación sin
                          echar a nadie, y al revés. */}
                      {REMOVABLE_ENTITY_TYPES.has(report.reported_entity_type) ? (
                        <Button
                          size="xs"
                          disabled={isPending || report.status === "ACTIONED"}
                          onClick={() => setDialog({ report, action: "remove" })}
                          className="border border-card-red/40 bg-transparent text-card-red hover:bg-card-red/10 hover:text-card-red"
                        >
                          Eliminar contenido
                        </Button>
                      ) : null}

                      {/* En una denuncia de perfil lo único que se puede sacar
                          sin suspender es la foto. Queda disponible mientras
                          la denuncia no esté ACTIONED: si el borrado del
                          archivo falló, este mismo botón lo reintenta. */}
                      {report.reported_entity_type === "USER" ? (
                        <Button
                          size="xs"
                          disabled={isPending || report.status === "ACTIONED"}
                          onClick={() => setDialog({ report, action: "remove-avatar" })}
                          className="border border-card-red/40 bg-transparent text-card-red hover:bg-card-red/10 hover:text-card-red"
                        >
                          Quitar foto
                        </Button>
                      ) : null}

                      {/* El autor sale de `reported_profile_id`, resuelto en el
                          servidor, así que se puede suspender a quien escribió
                          un mensaje o publicó una oferta, no sólo a un perfil
                          denunciado directamente. */}
                      {report.reportedUser ? (
                        <Button
                          size="xs"
                          disabled={isPending}
                          onClick={() =>
                            setDialog({ report, action: isSuspended ? "unban" : "suspend" })
                          }
                          className={cn(
                            !isSuspended &&
                              "border border-card-red/40 bg-transparent text-card-red hover:bg-card-red/10 hover:text-card-red",
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
        title={
          dialog?.action === "remove"
            ? "¿Eliminar el contenido denunciado?"
            : dialog?.action === "remove-avatar"
              ? "¿Quitar la foto de perfil?"
              : dialog?.action === "suspend"
              ? "¿Suspender usuario?"
              : "¿Levantar la suspensión?"
        }
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
          dialog?.action === "remove"
            ? // Se nombra el efecto REAL por tipo: «eliminar» significa cosas
              // distintas y el admin tiene que saber cuál está por ejecutar.
              dialog.report.reported_entity_type === "MESSAGE"
              ? "El mensaje se borra de la conversación. No se puede deshacer."
              : dialog.report.reported_entity_type === "TEAM"
                ? "Se reemplazan el nombre y el escudo del equipo. El equipo y su historial siguen existiendo."
                : "La publicación deja de estar activa y sale del Mercado."
            : dialog?.action === "remove-avatar"
              ? "Se borra la foto que se denunció: si sigue siendo la del perfil, sale del perfil; si la persona ya la cambió, su foto actual no se toca. La cuenta sigue activa. Una foto quitada puede seguir visible por URL hasta una hora (caché de la CDN)."
              : dialog?.action === "suspend"
                ? "El usuario pierde el acceso a la app de inmediato."
                : "El usuario recupera el acceso completo a la app."
        }
        confirmLabel={
          dialog?.action === "remove"
            ? "Eliminar"
            : dialog?.action === "remove-avatar"
              ? "Quitar foto"
              : dialog?.action === "suspend"
              ? "Suspender"
              : "Levantar"
        }
        tone={dialog?.action === "unban" ? "primary" : "danger"}
        loading={isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
