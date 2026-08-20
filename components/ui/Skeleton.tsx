import { cn } from "@/lib/utils";

/**
 * Placeholder de carga. El barrido es un pseudo-elemento con `translateX`
 * (keyframes `skeleton-shimmer` en globals.css) en vez de un `animate-pulse`
 * de opacidad: con varios skeletons en pantalla el pulso sincronizado hace
 * latir la página entera, el barrido no.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-md bg-surface-container",
        "after:absolute after:inset-0 after:-translate-x-full",
        "after:bg-gradient-to-r after:from-transparent after:via-surface-high after:to-transparent",
        "after:animate-[skeleton-shimmer_1.6s_infinite]",
        className,
      )}
    />
  );
}

/** Skeleton del bloque `PageHeader` (título + bajada). */
export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
    </div>
  );
}

/**
 * Fila de N tarjetas de KPI. `className` permite igualar la grilla real de
 * cada página (3 columnas en Salud, 4 en Resumen y Crecimiento); si no
 * coincide, el skeleton reflowea al llegar el dato y la página salta.
 */
export function StatCardsSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-3", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-lg border border-neutral-outline-variant bg-surface-container p-5"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-9 w-20" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/** Bloque de gráfico. `className` permite igualar el alto del chart real. */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn("h-72 rounded-lg border border-neutral-outline-variant", className)}
    />
  );
}

