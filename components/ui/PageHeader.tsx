import { cn } from "@/lib/utils";

/**
 * Encabezado de panel. Existe porque el par `h1 + p` estaba duplicado literal
 * en las cinco páginas del dashboard: cualquier ajuste de tipografía había que
 * hacerlo cinco veces.
 *
 * `actions` es el slot para lo que vive a la derecha del título (filtro de
 * fechas, botones de acción) sin que cada página reinvente el layout.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        <h1 className="font-display text-2xl uppercase text-neutral-on-surface">{title}</h1>
        {description ? (
          <p className="text-sm text-neutral-on-surface-variant">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
