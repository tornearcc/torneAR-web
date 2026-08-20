import { CalendarCheck, Store, Swords } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Partidos finalizados"
          value={sumBy(activityResult.data, (d) => d.matches_finished)}
          hint={`en ${range.days} días`}
          icon={Swords}
        />
        <StatCard
          label="Convocados"
          value={participants}
          hint={`${checkins.toLocaleString("es-AR")} hicieron check-in`}
          icon={CalendarCheck}
        />
        <StatCard
          label="Tasa de check-in"
          value={checkinRate === null ? null : `${checkinRate.toFixed(1)}%`}
          hint="sobre convocados del período"
          tone={checkinRate !== null && checkinRate < 50 ? "warning" : "neutral"}
        />
        <StatCard
          label="Mercado"
          value={applications}
          hint={`postulaciones sobre ${marketPosts} avisos`}
          icon={Store}
        />
      </div>

      {/*
        La pestaña activa viaja en la URL (`?tab=`) y no en estado local: así
        el filtro de fechas puede cambiar el rango sin devolver al admin a la
        primera pestaña, y un link a "Actividad / Mercado, últimos 90 días" es
        compartible entero.
      */}
      <Tabs defaultValue={resolveTab(params.tab)} className="gap-4">
        <TabsList>
          <TabsTrigger value="matches">Partidos</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="market">Mercado</TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="flex flex-col gap-6">
          <section>
            <h2 className="font-display mb-3 text-lg uppercase text-neutral-on-surface">
              Ciclo de vida por día
            </h2>
            {activityResult.error ? (
              <ErrorBox context="la serie de partidos" message={activityResult.error} />
            ) : (
              <ActivityTimeseriesChart data={activityResult.data} />
            )}
          </section>

          <section>
            <h2 className="font-display mb-1 text-lg uppercase text-neutral-on-surface">
              Distribución por estado
            </h2>
            <p className="mb-3 text-sm text-neutral-on-surface-variant">
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
          <p className="max-w-3xl text-sm text-neutral-on-surface-variant">
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
          <p className="max-w-3xl text-sm text-neutral-on-surface-variant">
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
    <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
      No se pudo cargar {context}: {message}
    </p>
  );
}
