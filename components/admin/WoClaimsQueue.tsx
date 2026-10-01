"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { CheckCheck, ImageOff, MapPinCheck, MessageSquareQuote, Star } from "lucide-react";
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
  return at ? `${people}, el ${formatDateTime(at)}` : people;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Sin fecha";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    timeZone: "America/Argentina/Buenos_Aires",
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
      {/* Un reclamo por renglón de la planilla: en la compu la evidencia a la
          izquierda y los datos con las acciones a la derecha, así cada
          reclamo entra entero sin scroll. En el celular, apilado. */}
      <div className="flex flex-col">
        {claims.map((claim) => (
          <article
            key={claim.claimId}
            aria-label={`Reclamo de ${claim.claimingTeamName} contra ${claim.opponentTeamName}`}
            className="grid grid-cols-1 gap-6 border-b border-chalk-line py-6 first:pt-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10"
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="text-lg font-semibold text-chalk">
                  {claim.claimingTeamName}{" "}
                  <span className="font-normal text-chalk-faint">contra</span>{" "}
                  {claim.opponentTeamName}
                </h2>
                <span className="text-sm text-chalk-dim">
                  {formatDate(claim.scheduledAt ?? claim.createdAt)}
                </span>
              </div>
              <p className="text-[15px] text-chalk-dim">
                Reclama {claim.claimingTeamName}:{" "}
                <span className="text-chalk">
                  {claim.reason ? (REASON_LABELS[claim.reason] ?? claim.reason) : "sin motivo"}
                </span>
              </p>

              {claim.evidence.kind === "url" ? (
                // La evidencia es la prueba sobre la que se decide: se abre en
                // pestaña nueva a tamaño completo. El link es una URL firmada
                // que vence a la hora; recargar la página la renueva.
                <a
                  href={claim.evidence.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block h-64 overflow-hidden rounded-md border border-chalk-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk"
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
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                  <span className="absolute bottom-2 right-2 rounded bg-pitch-deep/90 px-2 py-1 text-xs text-chalk">
                    Ver en tamaño completo
                  </span>
                </a>
              ) : claim.evidence.kind === "error" ? (
                <div className="flex h-24 items-center justify-center gap-2 rounded-md border border-card-red/40 bg-card-red/10 text-sm text-chalk">
                  <ImageOff className="size-4" aria-hidden="true" />
                  No se pudo cargar la evidencia. Recargá la página.
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center gap-2 rounded-md border border-dashed border-chalk-line text-sm text-chalk-faint">
                  <ImageOff className="size-4" aria-hidden="true" />
                  Sin evidencia fotográfica
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-[13px] text-chalk-faint">Goleadores propuestos</p>
                  {claim.scorers.length === 0 ? (
                    <p className="text-[15px] text-chalk-dim">No se cargaron goleadores.</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {claim.scorers.map((scorer, i) => (
                        <li
                          key={`${claim.claimId}-${scorer.profile_id}-${i}`}
                          className="flex items-center justify-between gap-3 text-[15px]"
                        >
                          <span className="text-chalk">{scorer.full_name ?? "Jugador"}</span>
                          <span className="font-display text-xl font-bold tabular-nums text-chalk">
                            {scorer.goals}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-3 flex items-center gap-2 text-[15px]">
                    <span className="text-[13px] text-chalk-faint">MVP</span>
                    {claim.mvpName ? (
                      <span className="flex items-center gap-1 font-medium text-chalk">
                        <Star className="size-3.5 fill-current" aria-hidden="true" />
                        {claim.mvpName}
                      </span>
                    ) : (
                      <span className="text-chalk-dim">Sin MVP</span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="mb-1.5 text-[13px] text-chalk-faint">Check-in</p>
                  <ul className="flex flex-col gap-1 text-[15px]">
                    <li className="flex flex-col">
                      <span className="text-chalk">{claim.claimingTeamName}</span>
                      <span className="flex items-center gap-1 text-chalk-dim">
                        <MapPinCheck className="size-3.5" aria-hidden="true" />
                        {checkinLabel(claim.claimingCheckinAt, claim.claimingCheckins)}
                      </span>
                    </li>
                    <li className="flex flex-col">
                      <span className="text-chalk">{claim.opponentTeamName}</span>
                      <span className="flex items-center gap-1 text-chalk-dim">
                        <MapPinCheck className="size-3.5" aria-hidden="true" />
                        {checkinLabel(claim.opponentCheckinAt, claim.opponentCheckins)}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <ResponseBlock claim={claim} nowTs={nowTs} />

              <div className="mt-auto flex flex-col-reverse gap-2 pt-6 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="h-10 border-card-red/40 bg-transparent text-card-red hover:bg-card-red/10 hover:text-card-red sm:h-9"
                  onClick={() => setDialog({ claim, approve: false })}
                  disabled={isPending}
                >
                  Rechazar reclamo
                </Button>
                <Button
                  className="h-10 sm:h-9"
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
                  Aprobar WO
                </Button>
              </div>
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
      <p className="mb-1.5 text-[13px] text-chalk-faint">
        Versión de {claim.opponentTeamName}
      </p>
      {claim.respondedAt !== null ? (
        <div className="rounded-md border border-chalk-line bg-slate/60 p-3">
          <p className="flex gap-2 text-[15px] text-chalk">
            <MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-neutral-outline" aria-hidden="true" />
            <span className="whitespace-pre-wrap">{claim.responseText}</span>
          </p>
          <p className="mt-2 text-[13px] text-chalk-faint">
            {claim.respondedByName ?? "Alguien del equipo"}, {formatDateTime(claim.respondedAt)}
          </p>
          {claim.responseEvidence.kind === "url" ? (
            <a
              href={claim.responseEvidence.url}
              target="_blank"
              rel="noreferrer"
              className="relative mt-3 block h-40 overflow-hidden rounded-md border border-chalk-line"
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
            <p className="mt-2 flex items-center gap-2 text-sm text-card-red">
              <ImageOff className="size-3.5" aria-hidden="true" />
              No se pudo cargar la foto de la respuesta. Recargá la página.
            </p>
          ) : null}
        </div>
      ) : isAwaitingResponse(claim, nowTs) ? (
        <p className="flex items-start gap-2.5 text-sm leading-snug text-chalk">
          <span aria-hidden="true" className="mt-0.5 h-4 w-3 shrink-0 -rotate-6 rounded-[2px] bg-card-yellow" />
          Tiene hasta el {formatDateTime(claim.responseDeadline!)} para responder. Hasta entonces no se puede aprobar;
          rechazar sí.
        </p>
      ) : (
        <p className="text-[15px] text-chalk-dim">
          No respondió en el plazo (venció el {formatDateTime(claim.responseDeadline!)}).
        </p>
      )}
    </div>
  );
}
