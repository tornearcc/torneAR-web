"use client";

import { useState, useTransition } from "react";
import { CalendarClock, CircleAlert, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
      <section className="rounded-lg border border-neutral-outline-variant bg-surface-container p-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-outline">
          Temporada activa
        </p>

        {active ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl uppercase text-neutral-on-surface">
                {active.name}
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                  active.isExpired
                    ? "bg-danger-error-container text-danger-on-error-container"
                    : "bg-brand-primary/15 text-brand-primary"
                }`}
              >
                {active.isExpired ? "Vencida" : "En curso"}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-2 text-sm text-neutral-on-surface-variant">
              <CalendarClock className="size-4" aria-hidden="true" />
              {formatDate(active.startsAt)} — {formatDate(active.endsAt)}
            </p>
            {active.isExpired ? (
              <p className="mt-3 flex items-start gap-2 rounded-md bg-danger-error-container/40 p-3 text-xs text-danger-on-error-container">
                <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
                La temporada venció: ejecutá la transición para abrir la siguiente.
              </p>
            ) : null}
          </>
        ) : (
          <p className="flex items-start gap-2 text-sm text-danger-error">
            <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
            No hay temporada activa — es un estado anómalo. Creá una con el formulario de
            abajo.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-neutral-outline-variant bg-surface-container p-5">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-outline">
          Nueva temporada
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <p className="mt-3 text-xs text-danger-error" role="alert">
            {formError}
          </p>
        ) : null}

        <Button
          onClick={handleSubmitPress}
          disabled={isPending}
          className="mt-5 bg-warning-tertiary text-warning-on-tertiary hover:bg-warning-tertiary/85"
        >
          Iniciar transición de temporada
        </Button>

        <p className="mt-4 max-w-2xl text-[11px] leading-5 text-neutral-outline">
          La transición cierra la temporada activa, pone en 0 las estadísticas de temporada
          (victorias, empates, derrotas y goles) de todos los equipos y pasa los partidos
          abiertos a la temporada nueva. El Rating y el historial de partidos jugados no se
          tocan.
        </p>
      </section>

      {history.length > 0 ? (
        <section>
          <h2 className="font-display mb-3 text-lg uppercase text-neutral-on-surface">
            Historial
          </h2>
          <div className="overflow-x-auto rounded-lg border border-neutral-outline-variant">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-outline-variant bg-surface-container text-neutral-on-surface-variant">
                  <th className="px-4 py-2 font-medium">Temporada</th>
                  <th className="px-4 py-2 font-medium">Inicio</th>
                  <th className="px-4 py-2 font-medium">Fin</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {history.map((season) => (
                  <tr
                    key={season.id}
                    className="border-b border-neutral-outline-variant last:border-0"
                  >
                    <td className="px-4 py-2.5 font-medium text-neutral-on-surface">
                      {season.name}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-on-surface-variant">
                      {formatDate(season.starts_at)}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-on-surface-variant">
                      {formatDate(season.ends_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      {season.is_active ? (
                        <span className="rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase bg-brand-primary/15 text-brand-primary">
                          Activa
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-outline">Cerrada</span>
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
  "w-full rounded-md border border-neutral-outline-variant bg-surface-low px-3 py-2 text-sm text-neutral-on-surface outline-none placeholder:text-neutral-outline focus:border-brand-primary";

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
      <span className="text-xs font-semibold text-neutral-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}
