"use client";

import { useState, useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { adminResolveDisputeAction } from "@/lib/admin-queues-actions";
import { formatScoreline } from "@/lib/dispute-scores";
import { cn } from "@/lib/utils";
import type {
  DisputeResolution,
  DisputedMatch,
  DisputedMatchSide,
} from "@/lib/admin-queues-data";

const FORMAT_SHORT: Record<string, string> = {
  FUTBOL_5: "F5",
  FUTBOL_6: "F6",
  FUTBOL_7: "F7",
  FUTBOL_8: "F8",
  FUTBOL_9: "F9",
  FUTBOL_11: "F11",
};

function formatDate(iso: string | null): string {
  if (!iso) return "Sin fecha";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function formatFps(value: number): string {
  return value.toLocaleString("es-AR", { maximumFractionDigits: 1 });
}

/**
 * Columnas de la planilla en la compu. Cada partido ocupa dos renglones, uno
 * por equipo, y el botón «Gana …» queda en el renglón de ese equipo: la
 * decisión se toma mirando el marcador que ese mismo equipo cargó.
 */
const LEDGER_COLUMNS =
  "md:grid-cols-[7rem_minmax(0,1fr)_9.5rem_3.5rem_4.5rem_minmax(9rem,13rem)]";

/**
 * Renglón de un equipo: el marcador COMPLETO que propuso, votos y Fair Play.
 *
 * Pintar `goals` a secas —los goles que ese equipo se adjudica— era el bug de
 * la versión vieja de la pantalla móvil: dos de esas cifras, una al lado de la
 * otra, se leen como un marcador y no lo son, porque salen de dos planillas
 * distintas. "A: 2  B: 3" no dice si el desacuerdo es de un gol o de cinco.
 * Cada renglón muestra el partido entero tal como lo cargó su equipo, siempre
 * en orden A–B (ver lib/dispute-scores), que es exactamente lo que ve el
 * jugador al votar.
 *
 * En la compu es un subgrid de la planilla; en el celular, un bloque con el
 * nombre y el marcador arriba, los números chicos abajo y el botón a lo ancho.
 */
function TeamRow({
  side,
  winLabel,
  onWin,
  disabled,
}: {
  side: DisputedMatchSide;
  winLabel: string;
  onWin: () => void;
  disabled: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-2",
        "md:col-span-5 md:grid-cols-subgrid md:gap-y-0",
      )}
    >
      <p className="truncate text-[17px] font-medium text-chalk md:text-base">{side.teamName}</p>

      <p className="text-right md:text-left">
        {side.scoreline === null ? (
          <span className="text-sm text-chalk-faint">No cargó</span>
        ) : (
          <span className="font-display text-[30px] font-bold leading-none tabular-nums text-chalk">
            {formatScoreline(side.scoreline)}
          </span>
        )}
      </p>

      <p className="col-span-2 text-sm text-chalk-dim md:col-span-1 md:text-[15px] md:tabular-nums">
        <span className="md:hidden">
          {side.votes} voto{side.votes === 1 ? "" : "s"}, Fair Play {formatFps(side.fairPlayScore)}
        </span>
        <span className="hidden md:inline">{side.votes}</span>
      </p>
      <p className="hidden text-[15px] tabular-nums text-chalk-dim md:block">
        {formatFps(side.fairPlayScore)}
      </p>

      <Button
        className="col-span-2 mt-2 h-10 min-w-0 md:col-span-1 md:mt-0 md:h-9"
        onClick={onWin}
        disabled={disabled}
      >
        <span className="truncate">{winLabel}</span>
      </Button>
    </div>
  );
}

const CONFIRM_COPY: Record<
  DisputeResolution,
  { title: string; impact: string; label: string }
> = {
  WIN_A: {
    title: "Dar por ganador al equipo local",
    impact:
      "El partido se finaliza con el marcador que cargó ese equipo (o 3-0 si nunca lo cargó). Se aplican Rating, estadísticas de temporada y Fair Play. Esta acción no se puede deshacer.",
    label: "Confirmar",
  },
  WIN_B: {
    title: "Dar por ganador al equipo visitante",
    impact:
      "El partido se finaliza con el marcador que cargó ese equipo (o 3-0 si nunca lo cargó). Se aplican Rating, estadísticas de temporada y Fair Play. Esta acción no se puede deshacer.",
    label: "Confirmar",
  },
  CANCEL: {
    title: "Anular el partido",
    impact:
      "El partido queda cancelado y NO computa: sin Rating, sin estadísticas y sin ganador. Se libera a los jugadores convocados. Esta acción no se puede deshacer.",
    label: "Anular",
  },
};

export function DisputesQueue({ matches }: { matches: DisputedMatch[] }) {
  const [dialog, setDialog] = useState<{
    match: DisputedMatch;
    resolution: DisputeResolution;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm(notes: string) {
    if (!dialog) return;
    const { match, resolution } = dialog;

    startTransition(async () => {
      const result = await adminResolveDisputeAction({
        matchId: match.matchId,
        resolution,
        adminNotes: notes,
      });

      if (result.ok) {
        setDialog(null);
        toast.success("Disputa resuelta", { description: result.message, duration: 6000 });
      } else {
        toast.error("No se pudo resolver la disputa", { description: result.error });
      }
    });
  }

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={CheckCheck}
        title="Todo al día"
        description="No hay partidos en disputa esperando resolución."
      />
    );
  }

  // Los empates totales primero: son los únicos que la resolución automática
  // no puede cerrar nunca, así que son los que de verdad requieren a un admin.
  const sorted = [...matches].sort(
    (a, b) => Number(b.isDeadlocked) - Number(a.isDeadlocked),
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-chalk-faint">
          Los dos marcadores de cada partido están en el mismo orden: local – visitante.
        </p>

        <div className={cn("md:grid", LEDGER_COLUMNS)}>
          {/* Encabezado de la planilla: sólo en la compu. Oculto para lectores
              de pantalla, que leen cada partido como un bloque con nombre. */}
          <div
            aria-hidden="true"
            className="hidden gap-x-4 border-b border-chalk-line pb-2 text-[13px] text-chalk-faint md:col-span-6 md:grid md:grid-cols-subgrid"
          >
            <span>Partido</span>
            <span>Equipo</span>
            <span>Marcador que cargó</span>
            <span>Votos</span>
            <span>Fair Play</span>
            <span />
          </div>

          {sorted.map((match) => (
            <article
              key={match.matchId}
              aria-label={`${match.teamA.teamName} contra ${match.teamB.teamName}`}
              className={cn(
                "relative flex flex-col border-b border-chalk-line py-4 md:col-span-6 md:grid md:grid-cols-subgrid md:gap-x-4 md:py-3",
                // Empate total: una tarjeta amarilla asomando a la izquierda
                // del renglón.
                match.isDeadlocked &&
                  "before:absolute before:-left-3 before:inset-y-4 before:w-[3px] before:rounded-full before:bg-card-yellow md:before:-left-4",
              )}
            >
              <div className="flex items-baseline justify-between gap-3 pb-1 md:row-span-2 md:flex-col md:items-start md:justify-start md:gap-0.5 md:py-2">
                <p className="text-[15px] text-chalk">{formatDate(match.scheduledAt)}</p>
                <p className="text-sm text-chalk-faint">
                  {match.matchType === "RANKING" ? "Ranking" : "Amistoso"}
                  {match.format ? `, ${FORMAT_SHORT[match.format] ?? match.format}` : ""}
                </p>
                <AnnulButton
                  className="mt-auto hidden md:inline-flex"
                  onClick={() => setDialog({ match, resolution: "CANCEL" })}
                  disabled={isPending}
                />
              </div>

              <TeamRow
                side={match.teamA}
                winLabel={`Gana ${match.teamA.teamName}`}
                onWin={() => setDialog({ match, resolution: "WIN_A" })}
                disabled={isPending}
              />
              <div aria-hidden="true" className="my-1 h-px bg-chalk-line/60 md:hidden" />
              <TeamRow
                side={match.teamB}
                winLabel={`Gana ${match.teamB.teamName}`}
                onWin={() => setDialog({ match, resolution: "WIN_B" })}
                disabled={isPending}
              />

              {match.isDeadlocked ? (
                <p className="mt-3 flex items-start gap-2.5 text-sm leading-snug text-chalk md:col-span-5 md:col-start-2 md:mt-1">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-3 shrink-0 -rotate-6 rounded-[2px] bg-card-yellow"
                  />
                  Empate total: mismos votos y mismo Fair Play. La resolución automática no puede
                  desempatar, así que este partido sólo se cierra desde acá.
                </p>
              ) : null}

              <AnnulButton
                className="mt-3 self-start md:hidden"
                onClick={() => setDialog({ match, resolution: "CANCEL" })}
                disabled={isPending}
              />
            </article>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog ? CONFIRM_COPY[dialog.resolution].title : ""}
        message={
          dialog ? (
            dialog.resolution === "CANCEL" ? (
              <>
                Se anula{" "}
                <strong className="text-neutral-on-surface">
                  {dialog.match.teamA.teamName} vs {dialog.match.teamB.teamName}
                </strong>
                .
              </>
            ) : (
              <>
                Gana{" "}
                <strong className="text-neutral-on-surface">
                  {dialog.resolution === "WIN_A"
                    ? dialog.match.teamA.teamName
                    : dialog.match.teamB.teamName}
                </strong>{" "}
                el partido contra{" "}
                {dialog.resolution === "WIN_A"
                  ? dialog.match.teamB.teamName
                  : dialog.match.teamA.teamName}
                .
              </>
            )
          ) : (
            ""
          )
        }
        impact={dialog ? CONFIRM_COPY[dialog.resolution].impact : undefined}
        confirmLabel={dialog ? CONFIRM_COPY[dialog.resolution].label : "Confirmar"}
        tone={dialog?.resolution === "CANCEL" ? "danger" : "primary"}
        loading={isPending}
        showNotesInput
        notesLabel="Motivo de la resolución"
        notesPlaceholder="Se le comparte a los dos equipos."
        onConfirm={handleConfirm}
      />
    </>
  );
}

/** Anular es la salida de excepción: texto rojo, sin el peso de un botón lleno. */
function AnnulButton({
  className,
  onClick,
  disabled,
}: {
  className?: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "items-center rounded-sm py-1 text-sm font-medium text-card-red underline-offset-4 hover:underline",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk disabled:opacity-50",
        className,
      )}
    >
      Anular partido
    </button>
  );
}
