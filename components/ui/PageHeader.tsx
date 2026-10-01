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
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {/* Frase normal y en Archivo: la condensada queda para los números. */}
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-chalk">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-[65ch] text-base text-chalk-dim">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
