"use client";

import { Loader2 } from "lucide-react";

import { useQueryNavigation } from "@/hooks/useQueryNavigation";
import { cn } from "@/lib/utils";

export interface SegmentOption {
  value: string;
  label: string;
  /** Contador opcional a la derecha de la etiqueta. */
  count?: number;
}

/**
 * Filtro de opciones excluyentes que vive en la URL.
 *
 * Mismo contrato que `DateRangeFilter`: escribe un parámetro, el Server
 * Component vuelve a consultar y el `loading.tsx` del segmento aparece solo.
 * `useQueryNavigation` se encarga de preservar el resto del query y de volver
 * a la página 1 al cambiar de filtro.
 *
 * `null` como `value` saca el parámetro de la URL — es lo que usa la opción
 * "todas", para que el estado por defecto no ensucie el link.
 */
export function SegmentedFilter({
  param,
  options,
  active,
  defaultValue,
}: {
  param: string;
  options: readonly SegmentOption[];
  active: string;
  /** Valor que se considera default y por lo tanto no se escribe en la URL. */
  defaultValue?: string;
}) {
  const { setParams, isPending } = useQueryNavigation();

  return (
    <div
      className={cn(
        "flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-md border border-chalk-line p-1",
        isPending && "opacity-70",
      )}
    >
      {isPending ? (
        <Loader2 className="ml-1.5 size-3.5 shrink-0 animate-spin text-chalk-dim" aria-hidden="true" />
      ) : null}

      {options.map((option) => {
        const isActive = option.value === active;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() =>
              setParams({ [param]: option.value === defaultValue ? null : option.value })
            }
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk",
              isActive
                ? "bg-slate-high font-medium text-chalk"
                : "text-chalk-dim hover:bg-slate hover:text-chalk",
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cn(
                  "text-xs tabular-nums",
                  isActive ? "text-chalk-dim" : "text-chalk-faint",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
