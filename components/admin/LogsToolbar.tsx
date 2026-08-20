"use client";

import { useEffect, useState } from "react";
import { Check, Filter, Loader2, Search, X } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryNavigation } from "@/hooks/useQueryNavigation";
import { cn } from "@/lib/utils";
import { LOG_LEVELS, PAGE_SIZES, type LogFilters, type LogLevel } from "@/lib/logs-filters";

const LEVEL_LABEL: Record<LogLevel, string> = {
  info: "Info",
  warn: "Warn",
  error: "Error",
};

const LEVEL_DOT: Record<LogLevel, string> = {
  info: "bg-info-secondary",
  warn: "bg-warning-tertiary",
  error: "bg-danger-error",
};

const SEARCH_DEBOUNCE_MS = 350;

/**
 * Controles del explorador de logs: niveles, búsqueda y filas por página.
 *
 * Los tres escriben en la URL y el re-fetch lo hace el Server Component. El
 * rango de fechas no está acá: usa el `DateRangeFilter` compartido, en el
 * header de la página, para que se maneje igual que en Crecimiento y
 * Actividad.
 */
export function LogsToolbar({ filters }: { filters: LogFilters }) {
  const { setParams, isPending } = useQueryNavigation();
  const [draft, setDraft] = useState(filters.query);

  // La búsqueda se debouncea contra la URL: sin esto, cada tecla dispara una
  // navegación y una query a Postgres.
  //
  // El `early return` cuando borrador y URL coinciden es lo que corta el
  // ciclo: `setParams` cambia de identidad en cada navegación (depende de
  // `searchParams`), así que el efecto vuelve a correr al terminar de navegar
  // — pero para entonces los dos valores son iguales y no se re-navega.
  const urlQuery = filters.query;

  useEffect(() => {
    if (draft === urlQuery) return;

    const timer = setTimeout(() => {
      setParams({ q: draft || null });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [draft, urlQuery, setParams]);

  const activeLevels = filters.levels;
  const allLevels = activeLevels.length === 0;

  function toggleLevel(level: LogLevel) {
    const next = activeLevels.includes(level)
      ? activeLevels.filter((l) => l !== level)
      : [...activeLevels, level];

    // Los tres seleccionados = ninguno: el parámetro se saca de la URL en vez
    // de escribir `level=info,warn,error`, que filtra exactamente lo mismo.
    const value = next.length === 0 || next.length === LOG_LEVELS.length ? null : next.join(",");
    setParams({ level: value });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-outline"
          aria-hidden="true"
        />
        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Buscar en el mensaje…"
          aria-label="Buscar en el mensaje del log"
          className="w-64 rounded-md border border-neutral-outline-variant bg-surface-low py-1.5 pl-8 pr-8 text-sm text-neutral-on-surface outline-none placeholder:text-neutral-outline focus:border-brand-primary"
        />
        {isPending ? (
          <Loader2
            className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-brand-primary"
            aria-hidden="true"
          />
        ) : null}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
              allLevels
                ? "border-neutral-outline-variant text-neutral-on-surface-variant hover:bg-surface-high"
                : "border-brand-primary/50 bg-brand-primary/10 text-brand-primary",
            )}
          >
            <Filter className="size-3.5" aria-hidden="true" />
            {allLevels
              ? "Todos los niveles"
              : activeLevels.map((l) => LEVEL_LABEL[l]).join(", ")}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuLabel>Nivel</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {LOG_LEVELS.map((level) => {
            const checked = allLevels || activeLevels.includes(level);
            return (
              // `onSelect` con preventDefault: sin eso el menú se cierra al
              // primer click y elegir dos niveles obliga a reabrirlo.
              <DropdownMenuItem
                key={level}
                onSelect={(event) => {
                  event.preventDefault();
                  toggleLevel(level);
                }}
                className="gap-2"
              >
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded border",
                    checked && !allLevels
                      ? "border-brand-primary bg-brand-primary/20"
                      : "border-neutral-outline",
                  )}
                >
                  {checked && !allLevels ? (
                    <Check className="size-3 text-brand-primary" aria-hidden="true" />
                  ) : null}
                </span>
                <span className={cn("size-2 rounded-full", LEVEL_DOT[level])} aria-hidden="true" />
                {LEVEL_LABEL[level]}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <label className="flex items-center gap-1.5 text-xs text-neutral-on-surface-variant">
        Filas
        <select
          value={filters.size}
          onChange={(e) => setParams({ size: Number(e.target.value) })}
          className="rounded-md border border-neutral-outline-variant bg-surface-low px-2 py-1.5 text-sm text-neutral-on-surface outline-none focus:border-brand-primary"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      {!allLevels || filters.query ? (
        <button
          type="button"
          onClick={() => {
            setDraft("");
            setParams({ level: null, q: null });
          }}
          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-neutral-on-surface-variant transition-colors hover:bg-surface-high hover:text-neutral-on-surface"
        >
          <X className="size-3.5" aria-hidden="true" />
          Limpiar
        </button>
      ) : null}
    </div>
  );
}
