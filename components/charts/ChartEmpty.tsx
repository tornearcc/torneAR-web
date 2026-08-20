import { cn } from "@/lib/utils";

/**
 * Estado vacío de un gráfico.
 *
 * Existía copiado literal en los tres charts originales. Importa más de lo que
 * parece en este dashboard: varios paneles nacen sin datos (§3.2 de
 * WEB_SPECIFICATION.md), así que el vacío es el estado por defecto y tiene que
 * leerse como "todavía no pasó nada", no como "el gráfico no cargó".
 */
export function ChartEmpty({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-64 items-center justify-center rounded-lg border border-dashed border-neutral-outline-variant bg-surface-container text-sm text-neutral-on-surface-variant",
        className,
      )}
    >
      {message}
    </div>
  );
}
