"use client";

import { useId, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { setTeamZoneAction } from "@/lib/admin-actions";
import type { AdminTeamRow } from "@/lib/teams-data";

/**
 * Excepción al candado de zona (D-55).
 *
 * Desde la app un equipo cambia de zona una sola vez por temporada. Esto es
 * para una mudanza real: el diálogo pide el motivo y la RPC lo registra. La
 * excepción no le consume al equipo su propio cambio de la temporada.
 */
export function TeamZoneDialog({
  team,
  zones,
  onOpenChange,
}: {
  team: AdminTeamRow | null;
  zones: string[];
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={team !== null} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Cuerpo aparte: Radix lo desmonta al cerrar y el estado nace limpio
            en cada apertura (mismo criterio que ProfileGenderDialog). */}
        {team ? (
          <TeamZoneBody
            team={team}
            zones={zones}
            isPending={isPending}
            startTransition={startTransition}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function TeamZoneBody({
  team,
  zones,
  isPending,
  startTransition,
  onClose,
}: {
  team: AdminTeamRow;
  zones: string[];
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  onClose: () => void;
}) {
  const [zone, setZone] = useState("");
  const [reason, setReason] = useState("");
  const zoneId = useId();
  const listId = useId();
  const reasonId = useId();

  const zoneTrimmed = zone.trim();
  const zoneIsValid = zones.includes(zoneTrimmed);
  const canSubmit =
    zoneIsValid && zoneTrimmed !== team.zone && reason.trim().length > 0 && !isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    startTransition(async () => {
      const result = await setTeamZoneAction({ teamId: team.id, zone: zoneTrimmed, reason });
      if (result.ok) {
        toast.success("Listo", { description: result.message });
        onClose();
      } else {
        toast.error("No se pudo cambiar la zona", { description: result.error });
      }
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold">Cambiar zona</DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-neutral-on-surface-variant">
          <strong className="text-neutral-on-surface">{team.name}</strong>, hoy en{" "}
          <strong className="text-neutral-on-surface">{team.zone}</strong>. Usalo sólo para una
          mudanza real, a pedido del capitán.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-lg border border-warning-tertiary/30 bg-warning-tertiary/10 p-3 text-xs leading-relaxed text-warning-tertiary">
        Desde la app, un equipo puede cambiar de zona una vez por temporada. Esta excepción queda
        registrada con el motivo y no le quita al equipo su propio cambio.
        {team.zoneLocked ? " Este equipo ya usó el suyo en esta temporada." : ""}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={zoneId} className="text-[13px] text-chalk-dim">
          Zona nueva
        </label>
        <input
          id={zoneId}
          list={listId}
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          placeholder="Escribí para buscar…"
          autoComplete="off"
          className="w-full rounded-md border border-neutral-outline-variant bg-pitch-deep px-3 py-2 text-sm text-neutral-on-surface outline-none placeholder:text-neutral-outline focus:border-chalk"
        />
        <datalist id={listId}>
          {zones.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        {zoneTrimmed && !zoneIsValid ? (
          <span className="text-xs text-danger-error">Elegí una zona de la lista.</span>
        ) : null}
        {zoneIsValid && zoneTrimmed === team.zone ? (
          <span className="text-xs text-neutral-outline">Es la zona actual del equipo.</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={reasonId} className="text-[13px] text-chalk-dim">
          Motivo (obligatorio)
        </label>
        <textarea
          id={reasonId}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej.: el equipo se mudó a Caballito, pedido del capitán por WhatsApp del 28/09"
          rows={3}
          className="w-full resize-y rounded-md border border-neutral-outline-variant bg-pitch-deep px-3 py-2 text-sm text-neutral-on-surface outline-none placeholder:text-neutral-outline focus:border-chalk"
        />
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Cambiar zona
        </Button>
      </DialogFooter>
    </>
  );
}
