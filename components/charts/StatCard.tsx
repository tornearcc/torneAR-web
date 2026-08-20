import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type StatTone = "neutral" | "positive" | "warning" | "danger";

const TONE_VALUE_CLASS: Record<StatTone, string> = {
  neutral: "text-neutral-on-surface",
  positive: "text-brand-primary",
  warning: "text-warning-tertiary",
  danger: "text-danger-error",
};

const TONE_BORDER_CLASS: Record<StatTone, string> = {
  neutral: "border-neutral-outline-variant",
  positive: "border-neutral-outline-variant",
  warning: "border-warning-tertiary/40",
  danger: "border-danger-error/40",
};

/**
 * Tarjeta de KPI.
 *
 * Acepta `value` como number o string ya formateado: hay métricas que no son
 * conteos (la tasa de check-in es un porcentaje con un decimal, y puede ser
 * `null` cuando no hubo partidos en la ventana — que no es lo mismo que 0%).
 *
 * `delta` es el valor del período anterior, no el porcentaje ya calculado: la
 * tarjeta se encarga de la división y, sobre todo, del caso que siempre se
 * escapa — cuando el período anterior fue 0, no hay porcentaje que mostrar y
 * un "+∞%" o un "+100%" serían mentira.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  delta,
  deltaInverted = false,
}: {
  label: string;
  value: number | string | null;
  /** Bajada corta: la unidad, la ventana temporal o el "de N totales". */
  hint?: string;
  icon?: LucideIcon;
  tone?: StatTone;
  /** Comparación contra el período previo. Sólo aplica si `value` es number. */
  delta?: { previous: number };
  /**
   * true cuando subir es malo (errores, disputas): invierte los colores sin
   * invertir la flecha, que sigue indicando la dirección real del cambio.
   */
  deltaInverted?: boolean;
}) {
  const numericValue = typeof value === "number" ? value : null;
  const comparison =
    delta && numericValue !== null ? describeDelta(numericValue, delta.previous) : null;

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border bg-surface-container p-5",
        TONE_BORDER_CLASS[tone],
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-neutral-on-surface-variant">{label}</p>
        {Icon ? (
          <Icon className="size-4 shrink-0 text-neutral-outline" aria-hidden="true" />
        ) : null}
      </div>

      <p className={cn("font-display mt-1 text-4xl tabular-nums", TONE_VALUE_CLASS[tone])}>
        {value === null ? "—" : typeof value === "number" ? value.toLocaleString("es-AR") : value}
      </p>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        {comparison ? (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold",
              deltaColor(comparison.direction, deltaInverted),
            )}
          >
            <comparison.Icon className="size-3" aria-hidden="true" />
            {comparison.text}
          </span>
        ) : null}
        {hint ? <span className="text-xs text-neutral-outline">{hint}</span> : null}
      </div>
    </div>
  );
}

type Direction = "up" | "down" | "flat";

function describeDelta(current: number, previous: number) {
  const direction: Direction =
    current > previous ? "up" : current < previous ? "down" : "flat";

  const Icon =
    direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : ArrowRight;

  // Sin base no hay porcentaje. Se muestra el valor absoluto del período
  // anterior para que el número de arriba tenga contexto igual.
  if (previous === 0) {
    return {
      direction,
      Icon,
      text: current === 0 ? "sin cambios" : `desde 0 el período previo`,
    };
  }

  const pct = ((current - previous) / previous) * 100;
  const sign = pct > 0 ? "+" : "";
  return {
    direction,
    Icon,
    text: `${sign}${pct.toFixed(pct % 1 === 0 ? 0 : 1)}% vs. previo`,
  };
}

function deltaColor(direction: Direction, inverted: boolean): string {
  if (direction === "flat") return "text-neutral-outline";
  const isGood = inverted ? direction === "down" : direction === "up";
  return isGood ? "text-brand-primary" : "text-danger-error";
}
