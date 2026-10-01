import { cn } from "@/lib/utils";

/**
 * Piezas del «tanteador»: el único elemento audaz del dashboard. Números
 * grandes en Barlow Condensed, sin caja alrededor, sobre el césped.
 */

/**
 * Línea de tiza que abre una sección, con su título a la izquierda. Separa
 * como las líneas de la cancha, sin encerrar el contenido en tarjetas.
 */
export function ChalkRule({
  title,
  id,
  action,
  className,
}: {
  title: string;
  /** Para `aria-labelledby` de la <section> que abre. */
  id?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <h2 id={id} className="shrink-0 text-base font-medium text-chalk-dim">
        {title}
      </h2>
      <span aria-hidden="true" className="h-px flex-1 bg-chalk-line" />
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

const FIGURE_SIZE = {
  // Escala de números del tanteador (plan: 40 a 72 px).
  md: "text-[40px]",
  lg: "text-[56px]",
  xl: "text-[56px] md:text-[72px]",
} as const;

/**
 * Un número del tanteador con su etiqueta abajo. `value` en null se pinta
 * como «—»: no es lo mismo «no hay dato» que 0.
 */
export function ScoreFigure({
  value,
  label,
  detail,
  size = "lg",
  tone = "chalk",
  className,
}: {
  value: number | string | null;
  label: React.ReactNode;
  /** Bajada chica: la comparación con el período anterior, el total, la ventana. */
  detail?: React.ReactNode;
  size?: keyof typeof FIGURE_SIZE;
  /** `go` sólo para un estado bueno que merece verse (p. ej. partidos en vivo). */
  tone?: "chalk" | "faint" | "go";
  className?: string;
}) {
  const shown =
    value === null ? "—" : typeof value === "number" ? value.toLocaleString("es-AR") : value;

  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <span
        className={cn(
          "font-display font-bold leading-[0.9] tabular-nums",
          FIGURE_SIZE[size],
          tone === "chalk" && "text-chalk",
          tone === "faint" && "text-chalk-faint",
          tone === "go" && "text-go",
        )}
      >
        {shown}
      </span>
      <span className="mt-2 text-base text-chalk">{label}</span>
      {detail ? <span className="mt-0.5 text-sm text-chalk-faint">{detail}</span> : null}
    </div>
  );
}
