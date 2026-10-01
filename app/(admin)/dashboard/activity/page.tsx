import { requireAdminAuth } from "@/lib/admin-guard";

import { createClient } from "@/lib/supabase/server";
import {
  fetchActivityTimeseries,
  fetchCheckinTimeseries,
  fetchMarketTimeseries,
  sumBy,
} from "@/lib/analytics-data";
import { formatRangeLabel, resolveDateRange } from "@/lib/date-range";
import { StatCard } from "@/components/charts/StatCard";
import { ActivityChart } from "@/components/charts/ActivityChart";
import { ActivityTimeseriesChart } from "@/components/charts/ActivityTimeseriesChart";
import { CheckinChart } from "@/components/charts/CheckinChart";
import { MarketChart } from "@/components/charts/MarketChart";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import { StatBoard } from "@/components/ui/Scoreboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Guarda propia además de la del layout: en el App Router corren en
  // paralelo y sin esto la página consulta igual sin sesión (P2-12).
  await requireAdminAuth();

  const params = await searchParams;
  const range = resolveDateRange(params);

  const supabase = await createClient();

  // Las cuatro consultas salen juntas aunque sólo una pestaña esté visible.
  // Con tabs del lado del cliente, cargarlas on-demand exigiría una ruta de
  // API por serie; son cuatro RPCs agregadas y baratas contra la misma
  // conexión, así que el trade-off es a favor de cambiar de pestaña sin
  // esperar nada.
  const [byStatus, activityResult, checkinResult, marketResult] = await Promise.all([
    supabase.rpc("dashboard_matches_by_status"),
    fetchActivityTimeseries(range),
    fetchCheckinTimeseries(range),
    fetchMarketTimeseries(range),
  ]);

  const participants = sumBy(checkinResult.data, (d) => d.participants);
  const checkins = sumBy(checkinResult.data, (d) => d.checkins);
  const checkinRate = participants > 0 ? (checkins / participants) * 100 : null;

  const marketPosts =
    sumBy(marketResult.data, (d) => d.player_posts) +
    sumBy(marketResult.data, (d) => d.team_posts);
  const applications = sumBy(marketResult.data, (d) => d.applications);

  return (
    <PageTransition>
      <PageHeader
        title="Actividad"
        description={formatRangeLabel(range)}
        actions={<DateRangeFilter range={range} />}
      />

      <StatBoard
        hero={
          <StatCard
            size="hero"
            label="Partidos jugados"
            value={sumBy(activityResult.data, (d) => d.matches_finished)}
            hint={`finalizados en ${range.days} días`}
          />
        }
      >
        <StatCard
          label="Convocados"
          value={participants}
          hint={`${checkins.toLocaleString("es-AR")} hicieron check-in`}
        />
        <StatCard
          label="Tasa de check-in"
          value={
            checkinRate === null
              ? null
              : `${checkinRate.toLocaleString("es-AR", { maximumFractionDigits: 1 })} %`
          }
          hint="sobre convocados del período"
          tone={checkinRate !== null && checkinRate < 50 ? "warning" : "neutral"}
        />
        <StatCard
          label="Postulaciones"
          value={applications}
          hint={`en el mercado, sobre ${marketPosts} avisos`}
        />
      </StatBoard>

      {/*
        La pestaña activa viaja en la URL (`?tab=`) y no en estado local: así
        el filtro de fechas puede cambiar el rango sin devolver al admin a la
        primera pestaña, y un link a "Actividad / Mercado, últimos 90 días" es
        compartible entero.
      */}
      <Tabs defaultValue={resolveTab(params.tab)} className="gap-4">
        <TabsList variant="line" className="max-w-full overflow-x-auto">
          <TabsTrigger value="matches">Partidos</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="market">Mercado</TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="flex flex-col gap-6">
          <section>
            <h2 className="chalk-rule mb-4">
              Ciclo de vida por día
            </h2>
            {activityResult.error ? (
              <ErrorBox context="la serie de partidos" message={activityResult.error} />
            ) : (
              <ActivityTimeseriesChart data={activityResult.data} />
            )}
          </section>

          <section>
            <h2 className="chalk-rule mb-2">
              Distribución por estado
            </h2>
            <p className="mb-4 max-w-[65ch] text-[15px] text-chalk-dim">
              Histórico completo — no depende del filtro de fechas.
            </p>
            {byStatus.error ? (
              <ErrorBox context="la distribución por estado" message={byStatus.error.message} />
            ) : (
              <ActivityChart data={byStatus.data ?? []} />
            )}
          </section>
        </TabsContent>

        <TabsContent value="checkins" className="flex flex-col gap-3">
          <p className="max-w-[65ch] text-[15px] text-chalk-dim">
            Convocados por día de partido, partidos cancelados excluidos. Las filas se
            imputan a la fecha del partido y no a la de la convocatoria: la tasa de
            presentismo es una propiedad del partido jugado.
          </p>
          {checkinResult.error ? (
            <ErrorBox context="la serie de check-ins" message={checkinResult.error} />
          ) : (
            <CheckinChart data={checkinResult.data} />
          )}
        </TabsContent>

        <TabsContent value="market" className="flex flex-col gap-3">
          <p className="max-w-[65ch] text-[15px] text-chalk-dim">
            Avisos publicados y postulaciones recibidas. Las postulaciones suman los dos
            lados del mercado — jugador que se ofrece a un equipo y equipo que busca
            jugador.
          </p>
          {marketResult.error ? (
            <ErrorBox context="la serie del mercado" message={marketResult.error} />
          ) : (
            <MarketChart data={marketResult.data} />
          )}
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}

const TABS = ["matches", "checkins", "market"] as const;

function resolveTab(value: string | string[] | undefined): (typeof TABS)[number] {
  const raw = Array.isArray(value) ? value[0] : value;
  return TABS.includes(raw as (typeof TABS)[number])
    ? (raw as (typeof TABS)[number])
    : "matches";
}

function ErrorBox({ context, message }: { context: string; message: string }) {
  return (
    <p className="rounded-md border border-card-red/40 bg-card-red/10 p-4 text-[15px] text-chalk">
      No se pudo cargar {context}: {message}
    </p>
  );
}
