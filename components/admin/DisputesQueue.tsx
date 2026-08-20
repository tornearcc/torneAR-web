"use client";

import { useState, useTransition } from "react";
import { CalendarDays, CheckCheck, Scale } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { adminResolveDisputeAction } from "@/lib/admin-queues-actions";
import { formatScoreline } from "@/lib/dispute-scores";
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
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFps(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/**
 * Columna de un equipo: el marcador COMPLETO que propuso, votos y Fair Play.
 *
 * Pintar `goals` a secas —los goles que ese equipo se adjudica— era el bug de
 * la versión vieja de la pantalla móvil: dos de esas cifras, una al lado de la
 * otra, se leen como un marcador y no lo son, porque salen de dos planillas
 * distintas. "A: 2  B: 3" no dice si el desacuerdo es de un gol o de cinco.
 * Cada columna muestra el partido entero tal como lo cargó su equipo, siempre
 * en orden A–B (ver lib/dispute-scores), que es exactamente lo que ve el
 * jugador al votar.
 */
function TeamColumn({
  side,
  align,
}: {
  side: DisputedMatchSide;
  align: "left" | "right";
}) {
  return (
    <div className={`flex min-w-0 flex-1 flex-col ${align === "right" ? "items-end" : ""}`}>
      <p className="w-full truncate text-sm font-semibold text-neutral-on-surface">
        {side.teamName}
      </p>
      <p className="font-display mt-1 text-3xl leading-none text-neutral-on-surface tabular-nums">
        {formatScoreline(side.scoreline)}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-neutral-outline">
        {side.scoreline === null ? "no cargó" : "cargó"}
      </p>
      <p className="mt-1 text-[11px] text-neutral-on-surface-variant">
        {side.votes} voto{side.votes === 1 ? "" : "s"} · FP {formatFps(side.fairPlayScore)}
      </p>
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
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {sorted.map((match) => (
          <article
            key={match.matchId}
            className="flex flex-col rounded-lg border border-neutral-outline-variant bg-surface-container p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  match.matchType === "RANKING"
                    ? "bg-warning-tertiary/20 text-warning-tertiary"
                    : "bg-info-secondary/15 text-info-secondary"
                }`}
              >
                {match.matchType === "RANKING" ? "Ranking" : "Amistoso"}
                {match.format ? ` · ${FORMAT_SHORT[match.format] ?? match.format}` : ""}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-neutral-on-surface-variant">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {formatDate(match.scheduledAt)}
              </span>
            </div>

            {/* La leyenda fija el eje: las dos cifras de cada columna son
                "local – visitante", no "míos – suyos". */}
            <p className="mb-2 mt-4 text-[10px] uppercase tracking-widest text-neutral-outline">
              Marcadores cargados ({match.teamA.teamName} – {match.teamB.teamName})
            </p>
            <div className="flex items-start gap-3">
              <TeamColumn side={match.teamA} align="left" />
              <span className="mt-7 text-xs text-neutral-outline">vs</span>
              <TeamColumn side={match.teamB} align="right" />
            </div>

            {match.isDeadlocked ? (
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-warning-tertiary/10 px-3 py-2.5 text-[11px] leading-relaxed text-warning-tertiary">
                <Scale className="mt-px size-4 shrink-0" aria-hidden="true" />
                Empate total: mismos votos y mismo Fair Play. La resolución automática no
                puede desempatar — este partido sólo se cierra desde acá.
              </p>
            ) : null}

            <div className="mt-auto flex flex-col gap-2 pt-5">
              <div className="flex gap-2">
                <Button
                  className="min-w-0 flex-1"
                  onClick={() => setDialog({ match, resolution: "WIN_A" })}
                  disabled={isPending}
                >
                  <span className="truncate">Gana {match.teamA.teamName}</span>
                </Button>
                <Button
                  className="min-w-0 flex-1"
                  onClick={() => setDialog({ match, resolution: "WIN_B" })}
                  disabled={isPending}
                >
                  <span className="truncate">Gana {match.teamB.teamName}</span>
                </Button>
              </div>
              <Button
                variant="outline"
                className="border-danger-error/30 bg-danger-error/10 text-danger-error hover:bg-danger-error/20 hover:text-danger-error"
                onClick={() => setDialog({ match, resolution: "CANCEL" })}
                disabled={isPending}
              >
                Anular el partido
              </Button>
            </div>
          </article>
        ))}
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
