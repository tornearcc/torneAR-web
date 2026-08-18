import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/charts/StatCard";
import { GrowthChart } from "@/components/charts/GrowthChart";

const SERIES_DAYS = 30;

export default async function GrowthPage() {
  const supabase = await createClient();

  const [summaryResult, seriesResult] = await Promise.all([
    supabase.rpc("dashboard_growth_summary").maybeSingle(),
    supabase.rpc("dashboard_signups_timeseries", { days: SERIES_DAYS }),
  ]);

  const summary = summaryResult.data;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl uppercase text-neutral-on-surface">Crecimiento</h1>
        <p className="text-sm text-neutral-on-surface-variant">
          Total histórico y altas de los últimos {SERIES_DAYS} días.
        </p>
      </div>

      {summaryResult.error ? (
        <ErrorBox context="el resumen de crecimiento" message={summaryResult.error.message} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Usuarios" value={summary?.profiles_count ?? 0} />
          <StatCard label="Equipos" value={summary?.teams_count ?? 0} />
          <StatCard label="Partidos" value={summary?.matches_count ?? 0} />
        </div>
      )}

      {seriesResult.error ? (
        <ErrorBox context="la serie de altas" message={seriesResult.error.message} />
      ) : (
        <GrowthChart data={seriesResult.data ?? []} />
      )}
    </div>
  );
}

function ErrorBox({ context, message }: { context: string; message: string }) {
  return (
    <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
      No se pudo cargar {context}: {message}
    </p>
  );
}
