import { AlertTriangle, FileText, TriangleAlert } from "lucide-react";

import { fetchLogsPage, fetchLogsTimeseries } from "@/lib/logs-data";
import { resolveLogFilters } from "@/lib/logs-filters";
import { formatRangeLabel } from "@/lib/date-range";
import { StatCard } from "@/components/charts/StatCard";
import { LogsChart } from "@/components/charts/LogsChart";
import { LogsTable } from "@/components/admin/LogsTable";
import { LogsToolbar } from "@/components/admin/LogsToolbar";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import { Pagination } from "@/components/ui/Pagination";

export default async function HealthPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filters = resolveLogFilters(params);

  const [seriesResult, logsResult] = await Promise.all([
    fetchLogsTimeseries(filters.range),
    fetchLogsPage(filters),
  ]);

  const totals = seriesResult.data.reduce(
    (acc, point) => ({
      info: acc.info + point.info_count,
      warn: acc.warn + point.warn_count,
      error: acc.error + point.error_count,
    }),
    { info: 0, warn: 0, error: 0 },
  );
  const totalLogs = totals.info + totals.warn + totals.error;
  const errorRate = totalLogs > 0 ? (totals.error / totalLogs) * 100 : null;

  // El gráfico resalta el día aislado sólo cuando el rango es exactamente un
  // día — que es la forma que toma al clickear una barra.
  const selectedDay = filters.range.days === 1 ? filters.range.from : null;

  return (
    <PageTransition>
      <PageHeader
        title="Salud técnica"
        description={formatRangeLabel(filters.range)}
        actions={<DateRangeFilter range={filters.range} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Logs en el período" value={totalLogs} hint={`${filters.range.days} días`} icon={FileText} />
        <StatCard
          label="Errores"
          value={totals.error}
          hint="nivel error"
          icon={AlertTriangle}
          tone={totals.error > 0 ? "danger" : "neutral"}
        />
        <StatCard
          label="Advertencias"
          value={totals.warn}
          hint="nivel warn"
          icon={TriangleAlert}
          tone={totals.warn > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Tasa de error"
          value={errorRate === null ? null : `${errorRate.toFixed(1)}%`}
          hint="sobre el total de logs"
          tone={errorRate !== null && errorRate > 10 ? "danger" : "neutral"}
        />
      </div>

      <section>
        <h2 className="font-display mb-1 text-lg uppercase text-neutral-on-surface">
          Logs por día
        </h2>
        <p className="mb-3 text-sm text-neutral-on-surface-variant">
          Clickeá una barra para aislar ese día en el explorador de abajo.
        </p>
        {seriesResult.error ? (
          <ErrorBox context="la serie de logs" message={seriesResult.error} />
        ) : (
          <LogsChart data={seriesResult.data} enableDayFilter selectedDay={selectedDay} />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg uppercase text-neutral-on-surface">
            Explorador de logs
          </h2>
          <LogsToolbar filters={filters} />
        </div>

        {logsResult.error ? (
          <ErrorBox context="el explorador de logs" message={logsResult.error} />
        ) : (
          <>
            <LogsTable rows={logsResult.rows} />
            <Pagination page={filters.page} size={filters.size} total={logsResult.total} />
          </>
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
