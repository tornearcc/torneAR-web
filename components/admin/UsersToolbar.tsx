"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

import { useQueryNavigation } from "@/hooks/useQueryNavigation";
import { SegmentedFilter } from "@/components/ui/SegmentedFilter";
import type { UserFilters } from "@/lib/users-data";

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "suspended", label: "Suspendidos" },
  { value: "admin", label: "Admins" },
] as const;

const SEARCH_DEBOUNCE_MS = 350;

export function UsersToolbar({ filters }: { filters: UserFilters }) {
  const { setParams, isPending } = useQueryNavigation();
  const [draft, setDraft] = useState(filters.search);

  // Mismo debounce contra la URL que el explorador de logs. El early return
  // cuando borrador y URL coinciden es lo que corta el ciclo: `setParams`
  // cambia de identidad en cada navegación, así que el efecto vuelve a correr
  // al terminar — pero para entonces los dos valores son iguales.
  const urlSearch = filters.search;

  useEffect(() => {
    if (draft === urlSearch) return;

    const timer = setTimeout(() => {
      setParams({ q: draft || null });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [draft, urlSearch, setParams]);

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
          placeholder="Buscar por usuario o nombre…"
          aria-label="Buscar usuarios"
          className="w-72 rounded-md border border-neutral-outline-variant bg-surface-low py-1.5 pl-8 pr-8 text-sm text-neutral-on-surface outline-none placeholder:text-neutral-outline focus:border-brand-primary"
        />
        {isPending ? (
          <Loader2
            className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-brand-primary"
            aria-hidden="true"
          />
        ) : null}
      </div>

      <SegmentedFilter
        param="status"
        options={STATUS_OPTIONS}
        active={filters.status}
        defaultValue="all"
      />

      {filters.search || filters.status !== "all" ? (
        <button
          type="button"
          onClick={() => {
            setDraft("");
            setParams({ q: null, status: null });
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
