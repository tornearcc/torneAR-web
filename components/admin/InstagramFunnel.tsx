import { rate } from "@/lib/instagram-insights-data";

export interface FunnelStep {
  label: string;
  value: number | null;
  /** De dónde sale el dato, en chico debajo de la etiqueta. */
  source: string;
}

/**
 * Embudo del período: de las vistas a los clicks registrados en /d/ig.
 *
 * Cada barra es el porcentaje del paso ANTERIOR (0-100 %), no el valor
 * absoluto: de miles de vistas a un puñado de clicks hay tres órdenes de
 * magnitud, y en una escala común los últimos pasos serían invisibles, que es
 * justo donde se pierde la gente. El número absoluto va al lado.
 */
export function InstagramFunnel({ steps }: { steps: FunnelStep[] }) {
  return (
    <ol className="flex flex-col gap-5">
      {steps.map((step, index) => {
        const previous = index > 0 ? steps[index - 1].value : null;
        const pct = index > 0 ? rate(step.value, previous) : null;

        return (
          <li key={step.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-4 gap-y-2">
            <div className="min-w-0">
              <p className="text-base text-chalk">{step.label}</p>
              <p className="text-xs text-chalk-faint">{step.source}</p>
            </div>
            <p className="font-display text-[32px] font-bold leading-none tabular-nums text-chalk">
              {step.value === null ? "—" : step.value.toLocaleString("es-AR")}
            </p>

            {index > 0 ? (
              <div className="col-span-2 flex items-center gap-3">
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full bg-slate-high"
                  role="img"
                  aria-label={pct === null ? "sin dato" : `${pct.toLocaleString("es-AR")} % del paso anterior`}
                >
                  <div
                    className="h-full rounded-full bg-chalk-dim"
                    style={{ width: `${Math.min(pct ?? 0, 100)}%`, minWidth: pct ? 4 : 0 }}
                  />
                </div>
                <p className="w-40 shrink-0 text-right text-sm tabular-nums text-chalk-dim">
                  {pct === null ? "—" : `${pct.toLocaleString("es-AR")} % del paso anterior`}
                </p>
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
