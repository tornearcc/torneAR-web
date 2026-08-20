import { UserPlus, Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  fetchAttributionStats,
  fetchGrowthTimeseries,
  fetchRetentionCohorts,
  sumBy,
} from "@/lib/analytics-data";
import { formatRangeLabel, resolveDateRange } from "@/lib/date-range";
import { StatCard } from "@/components/charts/StatCard";
import { GrowthChart } from "@/components/charts/GrowthChart";
import { RetentionCohorts } from "@/components/charts/RetentionCohorts";
import { AttributionChart } from "@/components/charts/AttributionChart";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";

export default async function GrowthPage({
  searchParams,
}: {
  // En Next 16 `searchParams` es una Promise — hay que await-earla antes de leer.
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const range = resolveDateRange(params);

  const supabase = await createClient();

  const [summaryResult, seriesResult, cohortsResult, attributionResult] = await Promise.all([
    supabase.rpc("dashboard_growth_summary").maybeSingle(),
    fetchGrowthTimeseries(range),
    fetchRetentionCohorts(8),
    fetchAttributionStats(range),
  ]);

  const summary = summaryResult.data;
  const signupsInRange = sumBy(seriesResult.data, (d) => d.signups);
  const teamsInRange = sumBy(seriesResult.data, (d) => d.teams);

  return (
    <PageTransition>
      <PageHeader
        title="Crecimiento"
        description={formatRangeLabel(range)}
        actions={<DateRangeFilter range={range} />}
      />

      {summaryResult.error ? (
        <ErrorBox context="el resumen de crecimiento" message={summaryResult.error.message} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Altas en el período"
            value={signupsInRange}
            hint={`${range.days} días`}
            icon={UserPlus}
            tone="positive"
          />
          <StatCard
            label="Equipos en el período"
            value={teamsInRange}
            hint={`${range.days} días`}
            icon={Users}
          />
          <StatCard
            label="Usuarios totales"
            value={summary?.profiles_count ?? 0}
            hint="histórico"
          />
          <StatCard
            label="Equipos totales"
            value={summary?.teams_count ?? 0}
            hint="histórico"
          />
        </div>
      )}

      <section>
        <h2 className="font-display mb-3 text-lg uppercase text-neutral-on-surface">
          Altas por día
        </h2>
        {seriesResult.error ? (
          <ErrorBox context="la serie de altas" message={seriesResult.error} />
        ) : (
          <GrowthChart data={seriesResult.data} />
        )}
      </section>

      <section>
        <h2 className="font-display mb-1 text-lg uppercase text-neutral-on-surface">
          Activación por cohorte
        </h2>
        <p className="mb-3 max-w-3xl text-sm text-neutral-on-surface-variant">
          De cada grupo que se dio de alta en la misma semana, cuántos llegaron a{" "}
          <strong className="text-neutral-on-surface">jugar un partido</strong> dentro de
          los 7 y los 28 días siguientes. Es activación acumulada, no retención semanal
          clásica. No depende del filtro de fechas de arriba: siempre muestra las últimas
          8 semanas, que es lo que hace comparables a las cohortes entre sí.
        </p>
        {cohortsResult.error ? (
          <ErrorBox context="las cohortes" message={cohortsResult.error} />
        ) : (
          <RetentionCohorts cohorts={cohortsResult.data} />
        )}
      </section>

      <section>
        <h2 className="font-display mb-1 text-lg uppercase text-neutral-on-surface">
          De dónde vienen
        </h2>
        <p className="mb-3 max-w-3xl text-sm text-neutral-on-surface-variant">
          Altas del período por canal de campaña (parámetros UTM capturados en{" "}
          <span className="font-mono text-neutral-on-surface-variant">/i/&lt;username&gt;</span>
          ). &quot;Orgánico&quot; es todo alta sin campaña asociada — no una ausencia de dato,
          sino nadie la trajo desde un link etiquetado.
        </p>
        {attributionResult.error ? (
          <ErrorBox context="la atribución de campañas" message={attributionResult.error} />
        ) : (
          <AttributionChart rows={attributionResult.data} />
        )}
      </section>
    </PageTransition>
  );
}

function ErrorBox({ context, message }: { context: string; message: string }) {
  return (
    <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
      No se pudo cargar {context}: {message}
    </p>
  );
}
