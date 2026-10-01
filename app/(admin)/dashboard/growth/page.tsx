import { requireAdminAuth } from "@/lib/admin-guard";

import { createClient } from "@/lib/supabase/server";
import {
  fetchAttributionStats,
  fetchGrowthTimeseries,
  fetchLinkClicks,
  fetchRetentionCohorts,
  sumBy,
} from "@/lib/analytics-data";
import { formatRangeLabel, resolveDateRange } from "@/lib/date-range";
import { StatCard } from "@/components/charts/StatCard";
import { GrowthChart } from "@/components/charts/GrowthChart";
import { RetentionCohorts } from "@/components/charts/RetentionCohorts";
import { AttributionChart } from "@/components/charts/AttributionChart";
import { LinkClicksTable } from "@/components/admin/LinkClicksTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import { StatBoard } from "@/components/ui/Scoreboard";

export default async function GrowthPage({
  searchParams,
}: {
  // En Next 16 `searchParams` es una Promise — hay que await-earla antes de leer.
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Guarda propia además de la del layout: en el App Router corren en
  // paralelo y sin esto la página consulta igual sin sesión (P2-12).
  await requireAdminAuth();

  const params = await searchParams;
  const range = resolveDateRange(params);

  const supabase = await createClient();

  const [summaryResult, seriesResult, cohortsResult, attributionResult, linkClicksResult] =
    await Promise.all([
      supabase.rpc("dashboard_growth_summary").maybeSingle(),
      fetchGrowthTimeseries(range),
      fetchRetentionCohorts(8),
      fetchAttributionStats(range),
      fetchLinkClicks(range),
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
        <StatBoard
          hero={
            <StatCard
              size="hero"
              label="Altas en el período"
              value={signupsInRange}
              hint={`usuarios nuevos en ${range.days} días`}
            />
          }
        >
          <StatCard
            label="Equipos nuevos"
            value={teamsInRange}
            hint={`en ${range.days} días`}
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
        </StatBoard>
      )}

      <section>
        <h2 className="chalk-rule mb-4">
          Altas por día
        </h2>
        {seriesResult.error ? (
          <ErrorBox context="la serie de altas" message={seriesResult.error} />
        ) : (
          <GrowthChart data={seriesResult.data} />
        )}
      </section>

      <section>
        <h2 className="chalk-rule mb-2">
          Activación por cohorte
        </h2>
        <p className="mb-4 max-w-[65ch] text-[15px] text-chalk-dim">
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
        <h2 className="chalk-rule mb-2">
          De dónde vienen
        </h2>
        <p className="mb-4 max-w-[65ch] text-[15px] text-chalk-dim">
          Altas del período por canal de campaña (parámetros UTM capturados en{" "}
          <span className="text-chalk">/i/&lt;username&gt;</span>
          ). &quot;Orgánico&quot; es todo alta sin campaña asociada — no una ausencia de dato,
          sino nadie la trajo desde un link etiquetado.
        </p>
        {attributionResult.error ? (
          <ErrorBox context="la atribución de campañas" message={attributionResult.error} />
        ) : (
          <AttributionChart rows={attributionResult.data} />
        )}
      </section>

      <section>
        <h2 className="chalk-rule mb-2">
          Links de descarga
        </h2>
        <p className="mb-4 max-w-[65ch] text-[15px] text-chalk-dim">
          Clicks del período en cada link de la campaña. Cada uno lleva a la App Store con su
          canal marcado, así que las <strong className="text-neutral-on-surface">descargas y
          primeras aperturas</strong> por canal se ven en App Store Connect → Analytics → Campañas
          (Apple las muestra a partir de 5 instalaciones). Desde Android llevan a la landing,
          porque la app todavía no está en Play. Las vistas previas de WhatsApp, Instagram o
          Facebook no cuentan como click.
        </p>
        {linkClicksResult.error ? (
          <ErrorBox context="los clicks de los links" message={linkClicksResult.error} />
        ) : (
          <LinkClicksTable rows={linkClicksResult.data} />
        )}
      </section>
    </PageTransition>
  );
}

function ErrorBox({ context, message }: { context: string; message: string }) {
  return (
    <p className="rounded-md border border-card-red/40 bg-card-red/10 p-4 text-[15px] text-chalk">
      No se pudo cargar {context}: {message}
    </p>
  );
}
