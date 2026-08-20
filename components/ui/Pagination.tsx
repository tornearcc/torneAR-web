"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { useQueryNavigation } from "@/hooks/useQueryNavigation";
import { cn } from "@/lib/utils";

/**
 * Paginador server-side.
 *
 * Muestra el rango real ("26-50 de 928") y no un conteo sobre lo ya cargado:
 * `total` viene del `count: "exact"` que hace la misma query que trajo la
 * página, así que el número de la derecha es la cantidad de filas que
 * matchean los filtros, no las que se descargaron.
 */
export function Pagination({
  page,
  size,
  total,
}: {
  page: number;
  size: number;
  total: number;
}) {
  const { setParams, isPending } = useQueryNavigation();

  const lastPage = Math.max(1, Math.ceil(total / size));
  const first = total === 0 ? 0 : (page - 1) * size + 1;
  const last = Math.min(page * size, total);

  // `page` viene de la URL y puede apuntar más allá del final (link viejo, o
  // el usuario editando el número a mano). El servidor ya devolvió 0 filas;
  // acá al menos los controles quedan coherentes.
  const canPrev = page > 1;
  const canNext = page < lastPage;

  function goTo(target: number) {
    // La página 1 no se escribe en la URL: es el default, y `?page=1` sólo
    // hace ruido en un link que se comparte.
    setParams({ page: target === 1 ? null : target }, { resetPage: false });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className={cn("text-xs text-neutral-on-surface-variant", isPending && "opacity-60")}>
        {total === 0 ? (
          "Sin resultados"
        ) : (
          <>
            <span className="tabular-nums text-neutral-on-surface">
              {first.toLocaleString("es-AR")}–{last.toLocaleString("es-AR")}
            </span>{" "}
            de <span className="tabular-nums">{total.toLocaleString("es-AR")}</span>
          </>
        )}
      </p>

      <div className="flex items-center gap-1">
        <PageButton
          label="Primera página"
          icon={ChevronsLeft}
          disabled={!canPrev || isPending}
          onClick={() => goTo(1)}
        />
        <PageButton
          label="Página anterior"
          icon={ChevronLeft}
          disabled={!canPrev || isPending}
          onClick={() => goTo(page - 1)}
        />

        <span className="px-2 text-xs tabular-nums text-neutral-on-surface-variant">
          {page} / {lastPage}
        </span>

        <PageButton
          label="Página siguiente"
          icon={ChevronRight}
          disabled={!canNext || isPending}
          onClick={() => goTo(page + 1)}
        />
        <PageButton
          label="Última página"
          icon={ChevronsRight}
          disabled={!canNext || isPending}
          onClick={() => goTo(lastPage)}
        />
      </div>
    </div>
  );
}

function PageButton({
  label,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-neutral-outline-variant p-1.5 text-neutral-on-surface-variant transition-colors hover:bg-surface-high hover:text-neutral-on-surface disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
