"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { CalendarDays, CheckCheck, Clock, ImageOff, MapPinCheck, MessageSquareQuote, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { resolveWoClaimAction } from "@/lib/admin-queues-actions";
import type { PendingWoClaim, WoEvidence } from "@/lib/admin-queues-data";

/** Una entrada de la cola con la evidencia ya firmada en el servidor. */
export interface WoClaimWithEvidence extends PendingWoClaim {
  evidence: WoEvidence;
  /** Foto de la respuesta del acusado (D-61), si mandó una. */
  responseEvidence: WoEvidence;
}

const REASON_LABELS: Record<string, string> = {
  NO_PRESENTACION: "No presentación",
  ABANDONO: "Abandono",
  INCIDENTE_CONDUCTA: "Incidente de conducta",
  CAMPO_NO_DISPONIBLE: "Campo no disponible",
  FALTA_QUORUM: "Falta de quórum",
  OTRO: "Otro",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function checkinLabel(at: string | null, count: number): string {
  if (!at && count === 0) return "Sin check-in";
  const people = `${count} ${count === 1 ? "jugador" : "jugadores"}`;
  return at ? `Check-in ${formatDateTime(at)} · ${people}` : people;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Sin fecha";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function WoClaimsQueue({ claims }: { claims: WoClaimWithEvidence[] }) {
  const [dialog, setDialog] = useState<{ claim: WoClaimWithEvidence; approve: boolean } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  // Hora de carga de la cola: alcanza para decidir si el acusado sigue en
  // plazo (la base vuelve a chequearlo al aprobar, RESPONSE_PENDING).
  const [nowTs] = useState(() => Date.now());

  function handleConfirm(notes: string) {
    if (!dialog) return;
    const { claim, approve } = dialog;

    startTransition(async () => {
      const result = await resolveWoClaimAction({
        claimId: claim.claimId,
        approve,
        // La nota sólo tiene sentido al rechazar (es el motivo que se le
        // devuelve al equipo); al aprobar el diálogo ni siquiera la pide.
        adminNotes: approve ? null : notes,
      });

      if (result.ok) {
        setDialog(null);
        toast.success(approve ? "WO aprobado" : "Reclamo rechazado", {
          description: result.message,
          duration: 6000,
        });
      } else {
        toast.error("No se pudo resolver el reclamo", { description: result.error });
      }
    });
  }

  if (claims.length === 0) {
    return (
      <EmptyState
        icon={CheckCheck}
        title="Todo al día"
        description="No hay reclamos de WO pendientes de revisión."
      />
    );
  }

  return (
    <>
      {/* Dos columnas desde lg: es la ganancia concreta de migrar esto del
          celular — cada reclamo entra entero, evidencia incluida, sin scroll. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {claims.map((claim) => (
          <article
            key={claim.claimId}
            className="flex flex-col rounded-lg border border-neutral-outline-variant bg-surface-container p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-semibold text-neutral-on-surface">
                {claim.claimingTeamName}{" "}
                <span className="font-normal text-neutral-outline">vs</span>{" "}
                {claim.opponentTeamName}
              </h2>
              <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-neutral-on-surface-variant">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {formatDate(claim.scheduledAt ?? claim.createdAt)}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-warning-tertiary/20 px-2.5 py-1 text-[11px] font-semibold text-warning-tertiary">
                {claim.reason ? (REASON_LABELS[claim.reason] ?? claim.reason) : "Sin motivo"}
              </span>
              <span className="text-[11px] text-neutral-on-surface-variant">
                Reclama {claim.claimingTeamName}
              </span>
            </div>

            <div className="mt-4">
              {claim.evidence.kind === "url" ? (
                // La evidencia es la prueba sobre la que se decide: se abre en
                // pestaña nueva a tamaño completo. El link es una URL firmada
                // que vence a la hora; recargar la página la renueva.
                <a
                  href={claim.evidence.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block h-56 overflow-hidden rounded-lg border border-neutral-outline-variant"
                >
                  {/* `unoptimized`: la foto va directo del navegador a Storage.
                      Optimizada pasaría por /_next/image, que la guarda 4 h sin
                      forma de invalidarla (default de Next 16) — más que la
                      vigencia de la firma — y cada token nuevo sería una
                      optimización nueva. Por lo mismo no hace falta un
                      `remotePatterns` para /object/sign/. */}
                  <Image
                    src={claim.evidence.url}
                    alt={`Evidencia del reclamo de ${claim.claimingTeamName}`}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <span className="absolute bottom-2 right-2 rounded bg-surface-lowest/85 px-2 py-1 text-[11px] text-neutral-on-surface opacity-0 transition-opacity group-hover:opacity-100">
                    Ver en tamaño completo →
                  </span>
                </a>
              ) : claim.evidence.kind === "error" ? (
                <div className="flex h-24 items-center justify-center gap-2 rounded-lg bg-danger-error-container text-xs text-danger-on-error-container">
                  <ImageOff className="size-4" aria-hidden="true" />
                  No se pudo cargar la evidencia. Recargá la página.
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center gap-2 rounded-lg bg-surface-high text-xs text-neutral-outline">
                  <ImageOff className="size-4" aria-hidden="true" />
                  Sin evidencia fotográfica
                </div>
              )}
            </div>

            <p className="mb-1.5 mt-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-outline">
              Goleadores propuestos
            </p>
            {claim.scorers.length === 0 ? (
              <p className="text-sm text-neutral-on-surface-variant">
                No se cargaron goleadores.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {claim.scorers.map((scorer, i) => (
                  <li
                    key={`${claim.claimId}-${scorer.profile_id}-${i}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-neutral-on-surface">
                      {scorer.full_name ?? "Jugador"}
                    </span>
                    <span className="font-semibold tabular-nums text-brand-primary">
                      {scorer.goals}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-outline">
                MVP
              </span>
              {claim.mvpName ? (
                <span className="flex items-center gap-1 font-semibold text-warning-tertiary">
                  <Star className="size-3.5 fill-current" aria-hidden="true" />
                  {claim.mvpName}
                </span>
              ) : (
                <span className="text-neutral-on-surface-variant">Sin MVP</span>
              )}
            </p>

            <p className="mb-1.5 mt-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-outline">
              Check-in
            </p>
            <ul className="flex flex-col gap-1 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span className="text-neutral-on-surface">{claim.claimingTeamName}</span>
                <span className="flex items-center gap-1 text-neutral-on-surface-variant">
                  <MapPinCheck className="size-3.5" aria-hidden="true" />
                  {checkinLabel(claim.claimingCheckinAt, claim.claimingCheckins)}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-neutral-on-surface">{claim.opponentTeamName}</span>
                <span className="flex items-center gap-1 text-neutral-on-surface-variant">
                  <MapPinCheck className="size-3.5" aria-hidden="true" />
                  {checkinLabel(claim.opponentCheckinAt, claim.opponentCheckins)}
                </span>
              </li>
            </ul>

            <ResponseBlock claim={claim} nowTs={nowTs} />

            {/* mt-auto: con tarjetas de alto distinto en la grilla, las
                acciones quedan alineadas al pie de cada una. */}
            <div className="mt-auto flex gap-2 pt-5">
              <Button
                variant="secondary"
                className="flex-1 text-danger-error"
                onClick={() => setDialog({ claim, approve: false })}
                disabled={isPending}
              >
                Rechazar
              </Button>
              <Button
                className="flex-1"
                onClick={() => setDialog({ claim, approve: true })}
                // D-61: con el acusado en plazo y sin respuesta, aprobar le
                // sacaría su derecho a contestar. Rechazar sí se puede.
                disabled={isPending || isAwaitingResponse(claim, nowTs)}
                title={
                  isAwaitingResponse(claim, nowTs)
                    ? "El equipo acusado todavía está en plazo para dar su versión"
                    : undefined
                }
              >
                Aprobar
              </Button>
            </div>
          </article>
        ))}
      </div>

      <ConfirmDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog?.approve ? "Aprobar WO" : "Rechazar WO"}
        message={
          dialog?.approve ? (
            <>
              El partido{" "}
              <strong className="text-neutral-on-surface">
                {dialog.claim.claimingTeamName} vs {dialog.claim.opponentTeamName}
              </strong>{" "}
              se cierra con W.O. a favor de {dialog.claim.claimingTeamName}.
            </>
          ) : (
            "El reclamo será rechazado. Podés dejar una nota con el motivo."
          )
        }
        impact={
          dialog?.approve ? (
            <>
              Se asigna el 3-0, se aplican Rating, estadísticas de temporada y Fair Play, y
              se acreditan los goleadores y el MVP propuestos.{" "}
              <strong>Esta acción no se puede deshacer.</strong>
            </>
          ) : undefined
        }
        confirmLabel={dialog?.approve ? "Aprobar" : "Rechazar"}
        tone={dialog?.approve ? "primary" : "danger"}
        loading={isPending}
        showNotesInput={dialog?.approve === false}
        notesLabel="Motivo del rechazo"
        notesPlaceholder="Opcional — se guarda junto al reclamo."
        onConfirm={handleConfirm}
      />
    </>
  );
}

function isAwaitingResponse(claim: WoClaimWithEvidence, nowTs: number): boolean {
  return (
    claim.respondedAt === null &&
    claim.responseDeadline !== null &&
    new Date(claim.responseDeadline).getTime() > nowTs
  );
}

/** La versión del equipo acusado (D-61), o en qué quedó su plazo. */
function ResponseBlock({ claim, nowTs }: { claim: WoClaimWithEvidence; nowTs: number }) {
  // Reclamos anteriores a 20260929140000: no había respuesta posible.
  if (claim.responseDeadline === null && claim.respondedAt === null) return null;

  return (
    <div className="mt-4">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-outline">
        Versión de {claim.opponentTeamName}
      </p>
      {claim.respondedAt !== null ? (
        <div className="rounded-lg border border-neutral-outline-variant bg-surface-high p-3">
          <p className="flex gap-2 text-sm text-neutral-on-surface">
            <MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-neutral-outline" aria-hidden="true" />
            <span className="whitespace-pre-wrap">{claim.responseText}</span>
          </p>
          <p className="mt-2 text-[11px] text-neutral-on-surface-variant">
            {claim.respondedByName ?? "Alguien del equipo"} · {formatDateTime(claim.respondedAt)}
          </p>
          {claim.responseEvidence.kind === "url" ? (
            <a
              href={claim.responseEvidence.url}
              target="_blank"
              rel="noreferrer"
              className="relative mt-3 block h-40 overflow-hidden rounded-lg border border-neutral-outline-variant"
            >
              <Image
                src={claim.responseEvidence.url}
                alt={`Foto de la respuesta de ${claim.opponentTeamName}`}
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </a>
          ) : claim.responseEvidence.kind === "error" ? (
            <p className="mt-2 flex items-center gap-2 text-xs text-danger-error">
              <ImageOff className="size-3.5" aria-hidden="true" />
              No se pudo cargar la foto de la respuesta. Recargá la página.
            </p>
          ) : null}
        </div>
      ) : isAwaitingResponse(claim, nowTs) ? (
        <p className="flex items-center gap-2 rounded-lg bg-warning-tertiary/10 px-3 py-2 text-xs text-warning-tertiary">
          <Clock className="size-3.5 shrink-0" aria-hidden="true" />
          Tiene hasta el {formatDateTime(claim.responseDeadline!)} para responder. Hasta entonces no se puede aprobar;
          rechazar sí.
        </p>
      ) : (
        <p className="text-sm text-neutral-on-surface-variant">
          No respondió en el plazo (venció el {formatDateTime(claim.responseDeadline!)}).
        </p>
      )}
    </div>
  );
}
