"use client";

import { useState, useTransition } from "react";
import { Copy, Handshake } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { setAmbassadorStatusAction, verifyAmbassadorFollowAction } from "@/lib/admin-actions";
import { copyText } from "@/lib/copy-text";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/supabase";

type AmbassadorRow = Database["public"]["Functions"]["dashboard_ambassadors"]["Returns"][number];

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const DEBUT_LABEL: Record<string, string> = {
  SIN_EQUIPO: "Sin equipo propio",
  DISPONIBLE: "Debut disponible",
  GANADO: "Debut ganado",
  PERDIDO: "Debut perdido",
};

export function AmbassadorsTable({ ambassadors }: { ambassadors: AmbassadorRow[] }) {
  const [dialog, setDialog] = useState<{
    row: AmbassadorRow;
    status: "ACTIVO" | "SUSPENDIDO";
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function toggleFollow(row: AmbassadorRow) {
    setBusyId(row.profile_id);
    startTransition(async () => {
      const result = await verifyAmbassadorFollowAction({
        profileId: row.profile_id,
        verified: row.follow_verified_at === null,
      });
      setBusyId(null);
      if (result.ok) toast.success(result.message);
      else toast.error("No se pudo actualizar", { description: result.error });
    });
  }

  function handleConfirm(note: string) {
    if (!dialog) return;
    const { row, status } = dialog;
    startTransition(async () => {
      const result = await setAmbassadorStatusAction({ profileId: row.profile_id, status, note });
      if (result.ok) {
        setDialog(null);
        toast.success(status === "SUSPENDIDO" ? "Embajador suspendido" : "Embajador reactivado", {
          description: result.message,
        });
      } else {
        toast.error("No se pudo aplicar la acción", { description: result.error });
      }
    });
  }

  if (ambassadors.length === 0) {
    return (
      <EmptyState
        icon={Handshake}
        title="Todavía no hay embajadores"
        description="Cuando alguien se inscriba desde la app aparece acá."
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="ledger-stack w-full border-collapse text-left text-[15px] md:min-w-[1100px]">
          <thead>
            <tr className="border-b border-chalk-line text-[13px] text-chalk-faint">
              <th className="px-3 py-2 font-normal">Embajador</th>
              <th className="px-3 py-2 font-normal">Mail</th>
              <th className="px-3 py-2 font-normal">Instagram</th>
              <th className="px-3 py-2 font-normal">Follow</th>
              <th className="px-3 py-2 font-normal">Equipo propio</th>
              <th className="px-3 py-2 font-normal">Alias</th>
              <th className="px-3 py-2 text-right font-normal">Traídos</th>
              <th className="px-3 py-2 text-right font-normal">Ganado</th>
              <th className="px-3 py-2 text-right font-normal">Pagado</th>
              <th className="px-3 py-2 font-normal">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ambassadors.map((a) => {
              const verified = a.follow_verified_at !== null;
              const suspended = a.status === "SUSPENDIDO";
              const busy = isPending && busyId === a.profile_id;
              return (
                <tr key={a.profile_id} className="border-b border-chalk-line">
                  <td data-label="Embajador" className="px-3 py-3">
                    <div>
                      <span className="font-medium text-chalk">@{a.username}</span>
                      {suspended ? (
                        <span className="ml-2 rounded-[4px] bg-card-red px-1.5 py-0.5 text-xs font-medium text-white">
                          Suspendido
                        </span>
                      ) : null}
                      <div className="text-chalk-dim">{a.full_name}</div>
                    </div>
                  </td>
                  <td data-label="Mail" className="break-all px-3 py-3 text-chalk-dim">
                    {a.email ?? "—"}
                  </td>
                  <td data-label="Instagram" className="px-3 py-3">
                    <a
                      href={`https://instagram.com/${a.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-chalk underline decoration-chalk-line underline-offset-2 hover:decoration-chalk"
                    >
                      @{a.instagram}
                    </a>
                  </td>
                  <td data-label="Follow" className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-block rounded-[4px] px-2 py-0.5 text-[13px] font-medium",
                        verified ? "border border-chalk-line text-go" : "bg-card-yellow text-on-card",
                      )}
                    >
                      {verified ? "Sigue ✓" : "Verificar"}
                    </span>
                  </td>
                  <td data-label="Equipo propio" className="px-3 py-3 text-chalk-dim">
                    <div>
                      <div className="text-chalk">{a.own_team_name ?? "—"}</div>
                      <div className="text-[13px]">{DEBUT_LABEL[a.debut_state] ?? a.debut_state}</div>
                    </div>
                  </td>
                  <td data-label="Alias" className="px-3 py-3">
                    {a.payout_alias ? (
                      <button
                        type="button"
                        onClick={() => copyText(a.payout_alias!, "Alias")}
                        className="inline-flex items-center gap-1.5 font-mono text-[14px] text-chalk hover:text-chalk-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk"
                        aria-label={`Copiar alias ${a.payout_alias}`}
                      >
                        {a.payout_alias}
                        <Copy className="size-3.5" aria-hidden="true" />
                      </button>
                    ) : (
                      <span className="text-chalk-faint">Sin cargar</span>
                    )}
                  </td>
                  <td data-label="Traídos" className="px-3 py-3 text-right tabular-nums text-chalk">
                    {a.teams_brought}
                  </td>
                  <td data-label="Ganado" className="px-3 py-3 text-right tabular-nums text-chalk">
                    {money.format(a.earned)}
                  </td>
                  <td data-label="Pagado" className="px-3 py-3 text-right tabular-nums text-chalk-dim">
                    {money.format(a.paid)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="xs" variant="outline" disabled={busy} onClick={() => toggleFollow(a)}>
                        {verified ? "Quitar verificación" : "Marcar que sigue"}
                      </Button>
                      <Button
                        size="xs"
                        disabled={isPending}
                        onClick={() => setDialog({ row: a, status: suspended ? "ACTIVO" : "SUSPENDIDO" })}
                        className={cn(
                          !suspended &&
                            "border border-card-red/40 bg-transparent text-card-red hover:bg-card-red/10 hover:text-card-red",
                        )}
                      >
                        {suspended ? "Reactivar" : "Suspender"}
                      </Button>
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
        title={dialog?.status === "SUSPENDIDO" ? "¿Suspender al embajador?" : "¿Reactivar al embajador?"}
        message={dialog ? <strong className="text-neutral-on-surface">@{dialog.row.username}</strong> : ""}
        impact={
          dialog?.status === "SUSPENDIDO"
            ? "Deja de generar premios nuevos. Los que ya tiene siguen como están."
            : "Vuelve a generar premios. Lo jugado durante la suspensión no se paga."
        }
        showNotesInput
        notesLabel="Nota (opcional)"
        notesPlaceholder="Motivo"
        confirmLabel={dialog?.status === "SUSPENDIDO" ? "Suspender" : "Reactivar"}
        tone={dialog?.status === "SUSPENDIDO" ? "danger" : "primary"}
        loading={isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
