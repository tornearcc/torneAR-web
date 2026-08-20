"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarRange, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  PRESET_LABELS,
  RANGE_PRESETS,
  type FixedPreset,
  type ResolvedRange,
} from "@/lib/date-range";

/**
 * Selector de rango de los paneles analíticos.
 *
 * Escribe en la URL y deja que el Server Component vuelva a pedir los datos:
 * el componente no conoce ni una sola métrica. `useTransition` es lo que hace
 * que el cambio no congele la UI — durante la navegación el panel viejo sigue
 * visible y atenuado en vez de parpadear a blanco, mientras el spinner del
 * botón dice que algo está pasando.
 */
export function DateRangeFilter({ range }: { range: ResolvedRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(range.from);
  const [customTo, setCustomTo] = useState(range.to);

  function navigate(query: URLSearchParams) {
    startTransition(() => {
      router.push(`${pathname}?${query.toString()}`, { scroll: false });
    });
  }

  function selectPreset(preset: FixedPreset) {
    // Se parte de los params actuales y no de cero: la página de Actividad
    // guarda también la pestaña activa en la URL, y reconstruir el query
    // desde cero la mandaría de vuelta a la primera en cada cambio de rango.
    const next = new URLSearchParams(searchParams.toString());
    next.set("range", preset);
    next.delete("from");
    next.delete("to");
    navigate(next);
  }

  function applyCustom() {
    if (!customFrom || !customTo || customFrom > customTo) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set("range", "custom");
    next.set("from", customFrom);
    next.set("to", customTo);
    setCustomOpen(false);
    navigate(next);
  }

  const customInvalid = !customFrom || !customTo || customFrom > customTo;

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-lg border border-neutral-outline-variant bg-surface-container p-1",
        isPending && "opacity-70",
      )}
    >
      {isPending ? (
        <Loader2
          className="ml-1.5 size-3.5 animate-spin text-brand-primary"
          aria-hidden="true"
        />
      ) : null}

      {RANGE_PRESETS.filter((p) => p !== "custom").map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => selectPreset(preset as FixedPreset)}
          aria-pressed={range.preset === preset}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            range.preset === preset
              ? "bg-surface-high text-brand-primary"
              : "text-neutral-on-surface-variant hover:bg-surface-high hover:text-neutral-on-surface",
          )}
        >
          {PRESET_LABELS[preset]}
        </button>
      ))}

      <Popover open={customOpen} onOpenChange={setCustomOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-pressed={range.preset === "custom"}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              range.preset === "custom"
                ? "bg-surface-high text-brand-primary"
                : "text-neutral-on-surface-variant hover:bg-surface-high hover:text-neutral-on-surface",
            )}
          >
            <CalendarRange className="size-3.5" aria-hidden="true" />
            {PRESET_LABELS.custom}
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-72">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-outline">
              Rango personalizado
            </p>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-neutral-on-surface-variant">Desde</span>
                <input
                  type="date"
                  value={customFrom}
                  max={customTo || undefined}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="rounded-md border border-neutral-outline-variant bg-surface-low px-2 py-1.5 text-xs text-neutral-on-surface outline-none focus:border-brand-primary"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-neutral-on-surface-variant">Hasta</span>
                <input
                  type="date"
                  value={customTo}
                  min={customFrom || undefined}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="rounded-md border border-neutral-outline-variant bg-surface-low px-2 py-1.5 text-xs text-neutral-on-surface outline-none focus:border-brand-primary"
                />
              </label>
            </div>

            <Button size="sm" onClick={applyCustom} disabled={customInvalid}>
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
