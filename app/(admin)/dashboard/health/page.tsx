import { requireAdminAuth } from "@/lib/admin-guard";

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
import { StatBoard } from "@/components/ui/Scoreboard";

export default async function HealthPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Guarda propia además de la del layout: en el App Router corren en
  // paralelo y sin esto la página consulta igual sin sesión (P2-12).
  await requireAdminAuth();

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

      {/* Los errores son el protagonista: es lo único de esta página que
          puede pedir una acción. En 0 se leen en verde, «en orden». */}
      <StatBoard
        hero={
          <StatCard
            size="hero"
            label="Errores"
            value={totals.error}
            hint={`nivel error, en ${filters.range.days} días`}
            tone={totals.error > 0 ? "danger" : "positive"}
          />
        }
      >
        <StatCard
          label="Advertencias"
          value={totals.warn}
          hint="nivel warn"
          tone={totals.warn > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Tasa de error"
          value={
            errorRate === null
              ? null
              : `${errorRate.toLocaleString("es-AR", { maximumFractionDigits: 1 })} %`
          }
          hint="sobre el total de logs"
          tone={errorRate !== null && errorRate > 10 ? "danger" : "neutral"}
        />
        <StatCard label="Logs en el período" value={totalLogs} hint={`${filters.range.days} días`} />
      </StatBoard>

      <section>
        <h2 className="chalk-rule mb-2">
          Logs por día
        </h2>
        <p className="mb-4 max-w-[65ch] text-[15px] text-chalk-dim">
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
          <h2 className="chalk-rule flex-1">
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
    <p className="rounded-md border border-card-red/40 bg-card-red/10 p-4 text-[15px] text-chalk">
      No se pudo cargar {context}: {message}
    </p>
  );
}
