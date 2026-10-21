"use client";

import { useState, useTransition } from "react";
import { Coins, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { setAmbassadorRewardStatusAction } from "@/lib/admin-actions";
import { copyText } from "@/lib/copy-text";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/supabase";

type RewardRow =
  Database["public"]["Functions"]["dashboard_ambassador_rewards"]["Returns"][number];

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const KIND_LABEL: Record<string, string> = {
  TEAM_BROUGHT: "Equipo traído",
  DEBUT: "Debut",
  BONUS_5: "Bono 5 equipos",
  BONUS_10: "Bono 10 equipos",
};

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagado",
  RECHAZADO: "Rechazado",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  PENDIENTE: "bg-card-yellow text-on-card",
  PAGADO: "border border-chalk-line text-go",
  RECHAZADO: "border border-chalk-line text-chalk-faint",
};

const FORMAT_LABEL: Record<string, string> = {
  FUTBOL_5: "Fútbol 5",
  FUTBOL_6: "Fútbol 6",
  FUTBOL_7: "Fútbol 7",
  FUTBOL_8: "Fútbol 8",
  FUTBOL_9: "Fútbol 9",
  FUTBOL_11: "Fútbol 11",
};

const dateFormat = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

export function AmbassadorRewardsTable({ rewards }: { rewards: RewardRow[] }) {
  const [dialog, setDialog] = useState<{
    reward: RewardRow;
    status: "PAGADO" | "RECHAZADO";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm(note: string) {
    if (!dialog) return;
    const { reward, status } = dialog;
    if (status === "RECHAZADO" && !note.trim()) {
      toast.error("Falta la nota", { description: "Rechazar un premio exige indicar el motivo." });
      return;
    }
    startTransition(async () => {
      const result = await setAmbassadorRewardStatusAction({ id: reward.id, status, note });
      if (result.ok) {
        setDialog(null);
        toast.success(status === "PAGADO" ? "Premio pagado" : "Premio rechazado", {
          description: result.message,
        });
      } else {
        toast.error("No se pudo actualizar el premio", {
          description: result.error,
          duration: 10000,
        });
      }
    });
  }

  if (rewards.length === 0) {
    return (
      <EmptyState
        icon={Coins}
        title="Sin premios todavía"
        description="Se generan solos cuando un equipo traído juega su primer partido válido."
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="ledger-stack w-full border-collapse text-left text-[15px] md:min-w-[1100px]">
          <thead>
            <tr className="border-b border-chalk-line text-[13px] text-chalk-faint">
              <th className="px-3 py-2 font-normal">Estado</th>
              <th className="px-3 py-2 font-normal">Embajador</th>
              <th className="px-3 py-2 font-normal">Premio</th>
              <th className="px-3 py-2 font-normal">Equipo y rival</th>
              <th className="px-3 py-2 font-normal">Partido</th>
              <th className="px-3 py-2 text-right font-normal">Monto</th>
              <th className="px-3 py-2 font-normal">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rewards.map((r) => {
              const pending = r.status === "PENDIENTE";
              const blocked = !r.follow_verified;
              return (
                <tr key={r.id} className="border-b border-chalk-line">
                  <td data-label="Estado" className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-block rounded-[4px] px-2 py-0.5 text-[13px] font-medium",
                        STATUS_BADGE_CLASS[r.status] ?? "border border-chalk-line text-chalk-dim",
                      )}
                    >
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                  <td data-label="Embajador" className="px-3 py-3">
                    <div>
                      <span className="font-medium text-chalk">@{r.ambassador_username}</span>
                      <div className="text-[13px] text-chalk-dim">
                        <a
                          href={`https://instagram.com/${r.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-chalk-line underline-offset-2"
                        >
                          @{r.instagram}
                        </a>
                        {" · "}
                        {r.follow_verified ? (
                          <span className="text-go">sigue ✓</span>
                        ) : (
                          <span className="text-card-yellow">follow sin verificar</span>
                        )}
                      </div>
                      {r.payout_alias ? (
                        <button
                          type="button"
                          onClick={() => copyText(r.payout_alias!, "Alias")}
                          className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-[13px] text-chalk-dim hover:text-chalk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk"
                          aria-label={`Copiar alias ${r.payout_alias}`}
                        >
                          {r.payout_alias}
                          <Copy className="size-3" aria-hidden="true" />
                        </button>
                      ) : (
                        <div className="text-[13px] text-chalk-faint">Sin alias cargado</div>
                      )}
                    </div>
                  </td>
                  <td data-label="Premio" className="px-3 py-3 font-medium text-chalk">
                    {KIND_LABEL[r.kind] ?? r.kind}
                  </td>
                  <td data-label="Equipo y rival" className="px-3 py-3 text-chalk-dim">
                    <div>
                      <span className="text-chalk">{r.team_name}</span>
                      {r.rival_team_name ? <> vs {r.rival_team_name}</> : null}
                      {r.counted_members > 0 ? (
                        <div className="text-[13px]">{r.counted_members} integrantes contados</div>
                      ) : null}
                    </div>
                  </td>
                  <td data-label="Partido" className="px-3 py-3 text-chalk-dim">
                    <div>
                      {r.finished_at ? dateFormat.format(new Date(r.finished_at)) : "—"}
                      <div className="text-[13px]">{FORMAT_LABEL[r.format] ?? r.format ?? "—"}</div>
                    </div>
                  </td>
                  <td data-label="Monto" className="px-3 py-3 text-right tabular-nums text-chalk">
                    {money.format(r.amount)}
                  </td>
                  <td className="px-3 py-3">
                    {pending ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={isPending || blocked}
                          title={blocked ? "Falta verificar el follow a @tornear.app" : undefined}
                          onClick={() => setDialog({ reward: r, status: "PAGADO" })}
                        >
                          Marcar pagado
                        </Button>
                        <Button
                          size="xs"
                          disabled={isPending}
                          onClick={() => setDialog({ reward: r, status: "RECHAZADO" })}
                          className="border border-card-red/40 bg-transparent text-card-red hover:bg-card-red/10 hover:text-card-red"
                        >
                          Rechazar
                        </Button>
                      </div>
                    ) : r.note ? (
                      <span className="text-[13px] text-chalk-dim">{r.note}</span>
                    ) : null}
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
        title={dialog?.status === "PAGADO" ? "¿Marcar el premio como pagado?" : "¿Rechazar el premio?"}
        message={
          dialog ? (
            <>
              <strong className="text-neutral-on-surface">@{dialog.reward.ambassador_username}</strong> —{" "}
              {KIND_LABEL[dialog.reward.kind] ?? dialog.reward.kind}, {money.format(dialog.reward.amount)}
              {dialog.status === "PAGADO" && dialog.reward.payout_alias
                ? ` al alias ${dialog.reward.payout_alias}`
                : ""}
              .
            </>
          ) : (
            ""
          )
        }
        impact={
          dialog?.status === "PAGADO"
            ? "Confirmá que ya hiciste la transferencia: el estado no se puede cambiar después."
            : "Libera el lugar. Si es un equipo traído, también cae el debut pendiente contra ese equipo y los bonos pendientes que ya no alcanzan."
        }
        showNotesInput
        notesLabel={dialog?.status === "RECHAZADO" ? "Motivo (obligatorio)" : "Nota (opcional)"}
        notesPlaceholder={
          dialog?.status === "RECHAZADO" ? "Por qué se rechaza" : "Ej.: transferencia del 25/10"
        }
        confirmLabel={dialog?.status === "PAGADO" ? "Marcar pagado" : "Rechazar"}
        tone={dialog?.status === "RECHAZADO" ? "danger" : "primary"}
        loading={isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
