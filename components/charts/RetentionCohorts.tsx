import { cn } from "@/lib/utils";

export interface RetentionCohortRow {
  cohort_week: string;
  cohort_size: number;
  played_7d: number;
  played_28d: number;
  mature_7d: boolean;
  mature_28d: boolean;
}

/**
 * Activación por cohorte semanal de alta.
 *
 * Tabla y no gráfico a propósito. Con un puñado de cohortes, una barra
 * apilada esconde el dato que importa —el tamaño de cada cohorte— detrás de
 * un porcentaje: 100% de 1 usuario y 92% de 25 se dibujan casi igual y no
 * significan lo mismo. La tabla muestra numerador, denominador y porcentaje
 * juntos.
 *
 * Server Component: es HTML estático, no hay razón para mandar JS.
 */
export function RetentionCohorts({ cohorts }: { cohorts: RetentionCohortRow[] }) {
  if (cohorts.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-neutral-outline-variant bg-surface-container text-sm text-neutral-on-surface-variant">
        Sin cohortes en el período.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-outline-variant">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-outline-variant bg-surface-container text-neutral-on-surface-variant">
            <th className="px-4 py-2 font-medium">Semana de alta</th>
            <th className="px-4 py-2 font-medium">Usuarios</th>
            <th className="px-4 py-2 font-medium">Jugó en 7 días</th>
            <th className="px-4 py-2 font-medium">Jugó en 28 días</th>
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort) => (
            <tr
              key={cohort.cohort_week}
              className="border-b border-neutral-outline-variant last:border-0"
            >
              <td className="whitespace-nowrap px-4 py-2.5 text-neutral-on-surface">
                {formatWeek(cohort.cohort_week)}
              </td>
              <td className="px-4 py-2.5 tabular-nums text-neutral-on-surface-variant">
                {cohort.cohort_size}
              </td>
              <RateCell
                numerator={cohort.played_7d}
                denominator={cohort.cohort_size}
                mature={cohort.mature_7d}
              />
              <RateCell
                numerator={cohort.played_28d}
                denominator={cohort.cohort_size}
                mature={cohort.mature_28d}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RateCell({
  numerator,
  denominator,
  mature,
}: {
  numerator: number;
  denominator: number;
  mature: boolean;
}) {
  const pct = denominator > 0 ? (numerator / denominator) * 100 : 0;

  return (
    <td className="px-4 py-2.5">
      <div className="flex items-center gap-2">
        {/* Barra proporcional en vez de sólo el número: con varias cohortes
            una al lado de la otra, la comparación visual es inmediata. */}
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-high">
          <div
            className={cn(
              "h-full rounded-full",
              mature ? "bg-brand-primary" : "bg-neutral-outline",
            )}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <span
          className={cn(
            "tabular-nums",
            mature ? "text-neutral-on-surface" : "text-neutral-outline",
          )}
        >
          {numerator}/{denominator}
          <span className="ml-1 text-xs">({pct.toFixed(0)}%)</span>
        </span>
        {/* Una cohorte cuya ventana todavía no cerró tiene el numerador
            incompleto por definición: sólo puede subir. Sin esta marca el
            número se compararía como si fuera final. */}
        {!mature ? (
          <span
            className="rounded bg-surface-high px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-outline"
            title="La ventana de esta cohorte todavía no cerró: el valor sólo puede subir."
          >
            parcial
          </span>
        ) : null}
      </div>
    </td>
  );
}

function formatWeek(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
