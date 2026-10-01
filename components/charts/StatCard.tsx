import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type StatTone = "neutral" | "positive" | "warning" | "danger";

const TONE_VALUE_CLASS: Record<StatTone, string> = {
  neutral: "text-chalk",
  positive: "text-go",
  warning: "text-card-yellow",
  danger: "text-card-red",
};

const SIZE_CLASS = {
  // Escala del tanteador: el protagonista de la página va en `hero`.
  md: "text-[40px]",
  hero: "text-[56px] md:text-[72px]",
} as const;

/**
 * Número del tanteador con su etiqueta: sin caja, sobre el césped.
 *
 * Reemplaza a la tarjeta de KPI de antes (misma API, así las páginas no
 * cambian de contrato). Una página de análisis tiene **un** número
 * protagonista (`size="hero"`) y el resto chico; ya no hay grillas de
 * tarjetas iguales.
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
  tone = "neutral",
  size = "md",
  delta,
  deltaInverted = false,
  className,
}: {
  label: string;
  value: number | string | null;
  /** Bajada corta: la unidad, la ventana temporal o el "de N totales". */
  hint?: string;
  /** Ya no se dibuja: el número y la etiqueta alcanzan. Se acepta por compatibilidad. */
  icon?: LucideIcon;
  tone?: StatTone;
  size?: keyof typeof SIZE_CLASS;
  /** Comparación contra el período previo. Sólo aplica si `value` es number. */
  delta?: { previous: number };
  /**
   * true cuando subir es malo (errores, disputas): una suba se pinta en rojo.
   * La flecha sigue indicando la dirección real del cambio.
   */
  deltaInverted?: boolean;
  className?: string;
}) {
  const numericValue = typeof value === "number" ? value : null;
  const comparison =
    delta && numericValue !== null ? describeDelta(numericValue, delta.previous) : null;

  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <p
        className={cn(
          "font-display font-bold leading-[0.9] tabular-nums",
          SIZE_CLASS[size],
          TONE_VALUE_CLASS[tone],
        )}
      >
        {value === null ? "—" : typeof value === "number" ? value.toLocaleString("es-AR") : value}
      </p>

      <p className="mt-2 text-base text-chalk">{label}</p>

      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
        {comparison ? (
          <span
            className={cn(
              "flex items-center gap-0.5",
              // Sólo una suba de algo malo pide atención; el resto se lee en tiza.
              deltaInverted && comparison.direction === "up" ? "text-card-red" : "text-chalk-dim",
            )}
          >
            <comparison.Icon className="size-3.5" aria-hidden="true" />
            {comparison.text}
          </span>
        ) : null}
        {hint ? <span className="text-chalk-faint">{hint}</span> : null}
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
    text: `${sign}${pct.toLocaleString("es-AR", { maximumFractionDigits: 1 })} % vs. previo`,
  };
}
