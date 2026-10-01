"use client";

import { useState, useTransition } from "react";
import { CalendarClock, CircleAlert, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ChalkRule, ScoreFigure } from "@/components/ui/Scoreboard";
import { transitionSeasonAction } from "@/lib/admin-queues-actions";
import type { ActiveSeasonInfo, SeasonRow } from "@/lib/admin-queues-data";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidISODate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function SeasonManager({
  active,
  history,
}: {
  active: ActiveSeasonInfo | null;
  history: SeasonRow[];
}) {
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Misma validación que corre la Server Action. Se duplica a propósito: acá
  // es para dar feedback inmediato sin ida y vuelta; allá es la que manda,
  // porque un cliente no valida nada de forma confiable.
  function validate(): string | null {
    if (!name.trim()) return "Ingresá el nombre de la nueva temporada (ej: Apertura 2027).";
    if (!isValidISODate(startsAt)) return "La fecha de inicio no es válida.";
    if (!isValidISODate(endsAt)) return "La fecha de fin no es válida.";
    if (startsAt >= endsAt) return "La fecha de inicio debe ser anterior a la de fin.";
    return null;
  }

  function handleSubmitPress() {
    const error = validate();
    setFormError(error);
    if (!error) setConfirmOpen(true);
  }

  function handleConfirm(_notes: string, typed: string) {
    startTransition(async () => {
      const result = await transitionSeasonAction({
        name,
        startsAt,
        endsAt,
        confirmation: typed,
        activeSeasonName: active?.name ?? null,
      });

      if (result.ok) {
        setConfirmOpen(false);
        setName("");
        setStartsAt("");
        setEndsAt("");
        toast.success("Temporada iniciada", { description: result.message, duration: 8000 });
      } else {
        toast.error("No se pudo ejecutar la transición", { description: result.error });
      }
    });
  }

  return (
    <>
      <section aria-labelledby="temporada-activa" className="flex flex-col gap-5">
        <ChalkRule id="temporada-activa" title="Temporada activa" />

        {active ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="min-w-0">
                <p className="text-[28px] font-semibold leading-tight tracking-tight text-chalk">
                  {active.name}
                </p>
                <p className="mt-1 flex items-center gap-2 text-[15px] text-chalk-dim">
                  <CalendarClock className="size-4" aria-hidden="true" />
                  Del {formatDate(active.startsAt)} al {formatDate(active.endsAt)}
                </p>
              </div>
              {active.isExpired ? null : (
                <ScoreFigure
                  value={daysUntil(active.endsAt)}
                  label="días para el cierre"
                  className="items-end text-right"
                />
              )}
            </div>
            {active.isExpired ? (
              <p className="flex items-start gap-3 rounded-md border border-card-red/40 bg-card-red/10 p-4 text-[15px] text-chalk">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-card-red" aria-hidden="true" />
                La temporada venció. Iniciá la transición de abajo para abrir la siguiente.
              </p>
            ) : null}
          </>
        ) : (
          <p className="flex items-start gap-2 text-[15px] text-card-red">
            <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
            No hay temporada activa — es un estado anómalo. Creá una con el formulario de
            abajo.
          </p>
        )}
      </section>

      <section aria-labelledby="nueva-temporada" className="flex flex-col gap-5">
        <ChalkRule id="nueva-temporada" title="Nueva temporada" />

        <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre" className="sm:col-span-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Apertura 2027"
              className={inputClass}
            />
          </Field>

          {/* `type="date"` y no el campo de texto YYYY-MM-DD del móvil: el
              navegador ya trae date picker y valida el formato solo, y el
              value que emite es exactamente el YYYY-MM-DD que espera la RPC. */}
          <Field label="Inicio">
            <input
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Fin">
            <input
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        {formError ? (
          <p className="mt-3 text-sm text-card-red" role="alert">
            {formError}
          </p>
        ) : null}

        <Button
          onClick={handleSubmitPress}
          disabled={isPending}
          className="h-10 self-start"
        >
          Iniciar transición de temporada
        </Button>

        <p className="max-w-[65ch] text-sm leading-relaxed text-chalk-faint">
          La transición cierra la temporada activa, pone en 0 las estadísticas de temporada
          (victorias, empates, derrotas y goles) de todos los equipos y pasa los partidos
          abiertos a la temporada nueva. El Rating y el historial de partidos jugados no se
          tocan.
        </p>
      </section>

      {history.length > 0 ? (
        <section>
          <h2 className="chalk-rule mb-4">
            Historial
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-[15px]">
              <thead>
                <tr className="border-b border-chalk-line text-[13px] text-chalk-faint">
                  <th className="px-3 py-2 font-normal">Temporada</th>
                  <th className="px-3 py-2 font-normal">Inicio</th>
                  <th className="px-3 py-2 font-normal">Fin</th>
                  <th className="px-3 py-2 font-normal">Estado</th>
                </tr>
              </thead>
              <tbody>
                {history.map((season) => (
                  <tr
                    key={season.id}
                    className="border-b border-chalk-line"
                  >
                    <td className="px-3 py-3 font-medium text-chalk">
                      {season.name}
                    </td>
                    <td className="px-3 py-3 text-neutral-on-surface-variant">
                      {formatDate(season.starts_at)}
                    </td>
                    <td className="px-3 py-3 text-neutral-on-surface-variant">
                      {formatDate(season.ends_at)}
                    </td>
                    <td className="px-3 py-3">
                      {season.is_active ? (
                        <span className="text-sm font-medium text-go">
                          Activa
                        </span>
                      ) : (
                        <span className="text-sm text-chalk-faint">Cerrada</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="¿Iniciar nueva temporada?"
        message={
          <>
            Se va a cerrar{" "}
            <strong className="text-neutral-on-surface">
              {active?.name ?? "la temporada activa"}
            </strong>{" "}
            y va a comenzar{" "}
            <strong className="text-neutral-on-surface">{name.trim()}</strong> (
            {startsAt} → {endsAt}).
          </>
        }
        impact={
          <>
            Las estadísticas de temporada (victorias, empates, derrotas y goles) de{" "}
            <strong>todos</strong> los equipos vuelven a 0, y los partidos abiertos pasan a
            la temporada nueva. El Rating y el historial de partidos jugados quedan
            intactos. <strong>Esta acción no se puede deshacer.</strong>
          </>
        }
        confirmLabel="Iniciar temporada"
        tone="danger"
        loading={isPending}
        requireTypedConfirmation={active?.name ?? null}
        onConfirm={handleConfirm}
      />
    </>
  );
}

const inputClass =
  "w-full rounded-md border border-chalk-line bg-pitch-deep px-3 py-2 text-[15px] text-chalk outline-none [color-scheme:dark] placeholder:text-chalk-faint focus:border-chalk";

/** Días que faltan hasta el final del día de `endsAt` (YYYY-MM-DD). */
function daysUntil(endsAt: string): number {
  const end = new Date(`${endsAt}T23:59:59`).getTime();
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-[13px] text-chalk-dim">{label}</span>
      {children}
    </label>
  );
}
