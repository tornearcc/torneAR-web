"use client";

import type { TooltipContentProps } from "recharts";

import { CHART_COLORS } from "./chart-theme";

/**
 * Tooltip compartido de todos los gráficos.
 *
 * Nace de un bug real: los tres charts pasaban `contentStyle={{ color: ... }}`
 * y aun así el texto salía negro sobre fondo negro. La causa es que en
 * Recharts 3 `contentStyle` se aplica SÓLO al wrapper — el label y cada ítem
 * se renderizan con sus propios estilos inline (`labelStyle`, `itemStyle`,
 * y el ítem además hereda el color de la serie), así que el `color` del
 * contenedor nunca los alcanza. Se puede parchear pasando también
 * `labelStyle` e `itemStyle` a cada `<Tooltip>`, pero eso son tres props de
 * estilo duplicadas en tres archivos.
 *
 * Renderizar el contenido nosotros lo resuelve de raíz: acá el color lo pone
 * una clase de Tailwind sobre HTML común y no hay nada que Recharts pueda
 * pisar.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  nameFormatter,
  valueFormatter,
}: Partial<TooltipContentProps<number, string>> & {
  /** Traduce la clave de la serie (`info_count` → `Info`). */
  nameFormatter?: (name: string) => string;
  /** Formatea el valor (miles, porcentajes, etc.). */
  valueFormatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;

  const heading =
    typeof labelFormatter === "function"
      ? labelFormatter(label, payload)
      : (label ?? null);

  return (
    <div
      className="rounded-lg border border-neutral-outline-variant bg-surface-high px-3 py-2 shadow-lg shadow-black/40"
      // `pointer-events-none`: el tooltip sigue al cursor y, si captura
      // eventos, parpadea al pasar por encima de sí mismo.
      style={{ pointerEvents: "none" }}
    >
      {heading != null && (
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-on-surface-variant">
          {heading}
        </p>
      )}

      <ul className="flex flex-col gap-1">
        {payload.map((entry, index) => {
          const name = String(entry.name ?? entry.dataKey ?? "");
          const rawValue = typeof entry.value === "number" ? entry.value : Number(entry.value);

          return (
            <li
              key={`${name}-${index}`}
              className="flex items-center gap-2 text-[13px] leading-none"
            >
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-[2px]"
                style={{ background: entry.color ?? CHART_COLORS.outline }}
              />
              <span className="text-neutral-on-surface-variant">
                {nameFormatter ? nameFormatter(name) : name}
              </span>
              <span className="ml-auto pl-3 font-semibold tabular-nums text-neutral-on-surface">
                {Number.isFinite(rawValue)
                  ? (valueFormatter?.(rawValue) ?? rawValue.toLocaleString("es-AR"))
                  : String(entry.value ?? "—")}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
