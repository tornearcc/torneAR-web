import Link from "next/link";
import { ArrowRight, CheckCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { DailyBars } from "@/components/charts/DailyBars";
import { PenaltyCard } from "@/components/ui/PenaltyCard";
import { ChalkRule, ScoreFigure } from "@/components/ui/Scoreboard";
import type { OverviewKpis, TeamSquads } from "@/lib/analytics-data";

const QUEUES = [
  {
    href: "/dashboard/disputes",
    key: "disputes_pending",
    label: "Disputas",
    pending: (n: number) => (n === 1 ? "Un partido sin acuerdo de resultado" : `${n} partidos sin acuerdo de resultado`),
  },
  {
    href: "/dashboard/wo-claims",
    key: "wo_claims_pending",
    label: "Reclamos WO",
    pending: (n: number) => (n === 1 ? "Un walkover para revisar" : `${n} walkovers para revisar`),
  },
  {
    href: "/dashboard/moderation",
    key: "reports_pending",
    label: "Moderación",
    pending: (n: number) => (n === 1 ? "Una denuncia para revisar" : `${n} denuncias para revisar`),
  },
] as const;

/**
 * El Resumen como tanteador: primero lo que necesita una decisión (las tres
 * colas, con tarjeta amarilla si tienen algo), después la cancha de hoy y al
 * final si la liga crece. Sin tarjetas iguales: números grandes sobre el
 * césped y líneas de tiza entre secciones.
 *
 * Componente de presentación puro (sin fetch) para que la página decida de
 * dónde salen los datos.
 */
export function OverviewBoard({
  kpis,
  squads,
  totals,
  signupsSeries,
}: {
  kpis: OverviewKpis;
  /** Equipos con 2+ integrantes; `null` si la consulta falló. */
  squads: TeamSquads | null;
  totals: { profiles: number; matches: number } | null;
  /** Altas por día de los últimos 30 días, `null` si la serie no cargó. */
  signupsSeries: { day: string; value: number }[] | null;
}) {
  const errors = kpis.errors_24h;
  const allClear =
    errors === 0 && QUEUES.every((queue) => kpis[queue.key] === 0);

  return (
    <div className="flex flex-col gap-12">
      {/* ── Lo que necesita una decisión ─────────────────────────────── */}
      <section aria-label="Colas pendientes" className="flex flex-col gap-6">
        {/* En el celular van las tres en fila, con la tarjeta arriba y sin la
            bajada: apiladas ocupaban media pantalla antes del primer dato. */}
        <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:gap-x-8">
          {QUEUES.map((queue) => {
            const count = kpis[queue.key];
            return (
              <li key={queue.href}>
                <Link
                  href={queue.href}
                  className="group -m-2 flex flex-col items-start gap-3 rounded-md p-2 sm:flex-row sm:items-center sm:gap-5 transition-colors hover:bg-slate/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk"
                >
                  <PenaltyCard count={count} size="lg" />
                  <span className="flex min-w-0 flex-col">
                    <span className="text-base font-semibold text-chalk group-hover:underline group-hover:underline-offset-4 sm:text-xl">
                      {queue.label}
                    </span>
                    <span className="sr-only sm:hidden">
                      {count > 0 ? `, ${queue.pending(count)}` : ", nada pendiente"}
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "hidden text-sm sm:block",
                        count > 0 ? "text-chalk-dim" : "text-chalk-faint",
                      )}
                    >
                      {count > 0 ? queue.pending(count) : "Nada pendiente"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {allClear ? (
          // El único lugar donde el verde dice algo: todo en orden.
          <p className="flex items-center gap-2 text-[15px] text-go">
            <CheckCheck className="size-4" aria-hidden="true" />
            Nada para decidir: sin colas pendientes ni errores en las últimas 24 h.
          </p>
        ) : null}

        {errors > 0 ? (
          <Link
            href="/dashboard/health"
            className="flex items-center gap-4 rounded-md border border-card-red/40 bg-card-red/10 px-4 py-3 transition-colors hover:bg-card-red/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk"
          >
            <PenaltyCard count={errors} tone="red" />
            <span className="min-w-0 flex-1 text-[15px] text-chalk">
              {errors === 1 ? "Un error" : `${errors} errores`} en la app en las últimas 24 h
              <span className="text-chalk-dim">
                {kpis.errors_prev_24h > 0 ? ` (el día anterior: ${kpis.errors_prev_24h})` : ""}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-chalk">
              <span className="sr-only sm:not-sr-only">Ver en Salud</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </Link>
        ) : null}
      </section>

      {/* ── La cancha hoy ────────────────────────────────────────────── */}
      <section aria-labelledby="cancha-hoy" className="flex flex-col gap-6">
        <ChalkRule id="cancha-hoy" title="La cancha hoy" />
        <div className="grid grid-cols-3 gap-6">
          <ScoreFigure value={kpis.matches_today} label="Partidos hoy" tone={kpis.matches_today > 0 ? "chalk" : "faint"} />
          <ScoreFigure
            value={kpis.matches_live}
            label="En vivo"
            tone={kpis.matches_live > 0 ? "go" : "faint"}
          />
          <ScoreFigure
            value={kpis.matches_upcoming_7d}
            label="Próximos 7 días"
            tone={kpis.matches_upcoming_7d > 0 ? "chalk" : "faint"}
          />
        </div>
      </section>

      {/* ── ¿Crece la liga? ──────────────────────────────────────────── */}
      <section aria-labelledby="crece-liga" className="flex flex-col gap-8">
        <ChalkRule
          id="crece-liga"
          title="¿Crece la liga?"
          action={
            <Link
              href="/dashboard/growth"
              className="flex items-center gap-1 rounded-sm text-sm text-chalk-dim hover:text-chalk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk"
            >
              Ver crecimiento
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* El número protagonista de la sección: equipos que dejaron de ser
              de una sola persona. Si la consulta falla, queda el dato más
              cercano (equipos activos) en vez de un hueco. */}
          {squads ? (
            <ScoreFigure
              size="xl"
              value={squads.teams_2plus_now}
              label="Equipos con 2 o más integrantes"
              detail={
                <>
                  {squadsComparison(squads.teams_2plus_7d_ago, squads.teams_2plus_now)}
                  <br />
                  {squads.teams_solo_now === 1
                    ? "1 equipo sigue siendo de una sola persona"
                    : `${squads.teams_solo_now.toLocaleString("es-AR")} equipos siguen siendo de una sola persona`}
                </>
              }
            />
          ) : (
            <ScoreFigure
              size="xl"
              value={kpis.active_teams}
              label="Equipos activos"
              detail={`de ${kpis.total_teams.toLocaleString("es-AR")} equipos creados`}
            />
          )}

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
            <ScoreFigure
              size="md"
              value={kpis.signups_7d}
              label="Altas en 7 días"
              detail={weekComparison(kpis.signups_7d, kpis.signups_prev_7d)}
            />
            <ScoreFigure
              size="md"
              value={kpis.matches_created_7d}
              label="Partidos creados en 7 días"
              detail={weekComparison(kpis.matches_created_7d, kpis.matches_created_prev_7d)}
            />
            {/*
              `null` y 0% no son lo mismo: null es "no hubo ningún partido en
              la ventana", 0% es "hubo partidos y no se presentó nadie".
            */}
            <ScoreFigure
              size="md"
              value={
                kpis.checkin_rate_30d === null
                  ? null
                  : `${kpis.checkin_rate_30d.toLocaleString("es-AR", { maximumFractionDigits: 1 })} %`
              }
              label="Tasa de check-in"
              detail={
                kpis.checkin_rate_30d === null
                  ? "sin partidos en 30 días"
                  : "convocados presentes, 30 días"
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
            <span className="text-chalk-dim">Altas por día, últimos 30 días</span>
            {totals ? (
              <span className="text-chalk-faint">
                {totals.profiles.toLocaleString("es-AR")} usuarios y{" "}
                {totals.matches.toLocaleString("es-AR")} partidos en total
              </span>
            ) : null}
          </p>
          {signupsSeries ? (
            <DailyBars data={signupsSeries} seriesName="Altas" />
          ) : (
            <p className="py-6 text-sm text-chalk-faint">
              No se pudo cargar la serie de altas. Recargá la página para reintentar.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

/** «Eran 22 hace 7 días (+1)». */
function squadsComparison(before: number, now: number): string {
  const diff = now - before;
  const change = diff === 0 ? "sin cambios" : `${diff > 0 ? "+" : "−"}${Math.abs(diff).toLocaleString("es-AR")}`;
  return `Eran ${before.toLocaleString("es-AR")} hace 7 días (${change})`;
}

/**
 * Comparación con la semana anterior en palabras. Sin porcentaje: con números
 * de a decenas, «+200 %» exagera lo que en la liga es pasar de 2 a 6.
 * En tiza y no en verde o rojo: una baja semanal no es algo para resolver.
 */
function weekComparison(current: number, previous: number): string {
  const diff = current - previous;
  if (diff === 0) return "igual que la semana anterior";
  const sign = diff > 0 ? "+" : "−";
  return `${sign}${Math.abs(diff).toLocaleString("es-AR")} vs. la semana anterior`;
}
