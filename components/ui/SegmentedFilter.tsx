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
        "flex items-center gap-1 rounded-lg border border-neutral-outline-variant bg-surface-container p-1",
        isPending && "opacity-70",
      )}
    >
      {isPending ? (
        <Loader2 className="ml-1.5 size-3.5 animate-spin text-brand-primary" aria-hidden="true" />
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
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "bg-surface-high text-brand-primary"
                : "text-neutral-on-surface-variant hover:bg-surface-high hover:text-neutral-on-surface",
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] tabular-nums",
                  isActive ? "bg-brand-primary/20" : "bg-surface-variant",
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
