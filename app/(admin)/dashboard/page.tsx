import { requireAdminAuth } from "@/lib/admin-guard";

import { createClient } from "@/lib/supabase/server";
import { fetchGrowthTimeseries, fetchOverviewKpis } from "@/lib/analytics-data";
import { resolveDateRange } from "@/lib/date-range";
import { OverviewBoard } from "@/components/admin/OverviewBoard";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";

/** «Hoy, miércoles 30/09», en la hora de Argentina y no la del servidor. */
function todayTitle(now = new Date()) {
  const tz = "America/Argentina/Buenos_Aires";
  const weekday = now.toLocaleDateString("es-AR", { weekday: "long", timeZone: tz });
  const date = now.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", timeZone: tz });
  return `Hoy, ${weekday} ${date}`;
}

export default async function DashboardHomePage() {
  // Guarda propia además de la del layout: en el App Router corren en
  // paralelo y sin esto la página consulta igual sin sesión (P2-12).
  await requireAdminAuth();

  const supabase = await createClient();

  const [{ data: summary }, { data: kpis, error }, series] = await Promise.all([
    supabase.rpc("dashboard_growth_summary").maybeSingle(),
    fetchOverviewKpis(),
    fetchGrowthTimeseries(resolveDateRange({ range: "30d" })),
  ]);

  return (
    <PageTransition className="gap-10">
      <PageHeader title={todayTitle()} />

      {error || !kpis ? (
        <p className="rounded-md border border-card-red/40 bg-card-red/10 p-4 text-[15px] text-chalk">
          No se pudieron cargar los números del resumen: {error ?? "la consulta volvió vacía"}.
          Recargá la página para reintentar.
        </p>
      ) : (
        <OverviewBoard
          kpis={kpis}
          totals={
            summary ? { profiles: summary.profiles_count, matches: summary.matches_count } : null
          }
          signupsSeries={
            series.error ? null : series.data.map((p) => ({ day: p.day, value: p.signups }))
          }
        />
      )}
    </PageTransition>
  );
}
