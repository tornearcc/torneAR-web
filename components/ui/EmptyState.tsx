import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Estado vacío de las colas de gestión.
 *
 * En este dashboard el vacío es el estado *deseable* (una cola de disputas en
 * cero significa que no hay nada roto), así que el default se pinta con el
 * verde de marca y no en gris apagado: leerlo tiene que sentirse como una
 * confirmación, no como un panel que no cargó. `tone="neutral"` es para los
 * vacíos que sí son ausencia de datos.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  tone = "positive",
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: "positive" | "neutral";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-neutral-outline-variant bg-surface-container px-6 py-20 text-center",
        className,
      )}
    >
      <Icon
        className={cn(
          "size-10",
          tone === "positive" ? "text-brand-primary" : "text-neutral-outline",
        )}
        aria-hidden="true"
      />
      <p className="font-display text-xl uppercase text-neutral-on-surface">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-neutral-on-surface-variant">{description}</p>
      ) : null}
    </div>
  );
}
