"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { useQueryNavigation } from "@/hooks/useQueryNavigation";

const SEARCH_DEBOUNCE_MS = 350;

/** Búsqueda por nombre de equipo, con el mismo debounce contra la URL que UsersToolbar. */
export function TeamsToolbar({ search }: { search: string }) {
  const { setParams, isPending } = useQueryNavigation();
  const [draft, setDraft] = useState(search);

  useEffect(() => {
    if (draft === search) return;
    const timer = setTimeout(() => setParams({ q: draft || null }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, search, setParams]);

  return (
    <div className="relative w-72 max-w-full">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-outline"
        aria-hidden="true"
      />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Buscar equipo…"
        aria-label="Buscar equipos"
        className="w-full rounded-md border border-chalk-line bg-pitch-deep py-2 pl-8 pr-8 text-[15px] text-neutral-on-surface outline-none placeholder:text-neutral-outline focus:border-chalk"
      />
      {isPending ? (
        <Loader2
          className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-chalk-dim"
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}
