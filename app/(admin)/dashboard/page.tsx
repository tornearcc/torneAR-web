import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  Flag,
  Radio,
  Scale,
  ShieldAlert,
  Swords,
  UserPlus,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { fetchOverviewKpis } from "@/lib/analytics-data";
import { StatCard } from "@/components/charts/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";

const PANELS = [
  { href: "/dashboard/growth", label: "Crecimiento", description: "Altas, equipos y activación." },
  { href: "/dashboard/viral", label: "Viralidad", description: "Referidos y embajadores." },
  { href: "/dashboard/social", label: "Redes", description: "Seguidores de Instagram, TikTok y X." },
  { href: "/dashboard/content", label: "Contenido", description: "Tarjetas exportables para redes." },
  { href: "/dashboard/activity", label: "Actividad", description: "Partidos, check-ins y mercado." },
  { href: "/dashboard/health", label: "Salud", description: "Errores y explorador de logs." },
  { href: "/dashboard/users", label: "Usuarios", description: "Cuentas, suspensiones y roles." },
  { href: "/dashboard/seasons", label: "Temporadas", description: "Cierre y apertura de temporada." },
] as const;

// Separadas de PANELS a propósito: éstas no se leen, se operan.
const QUEUES = [
  {
    href: "/dashboard/disputes",
    label: "Disputas",
    description: "Partidos sin acuerdo de resultado.",
    key: "disputes_pending",
  },
  {
    href: "/dashboard/wo-claims",
    label: "Reclamos WO",
    description: "Walkovers esperando revisión.",
    key: "wo_claims_pending",
  },
  {
    href: "/dashboard/moderation",
    label: "Moderación",
    description: "Denuncias y feedback.",
    key: "reports_pending",
  },
] as const;

export default async function DashboardHomePage() {
  const supabase = await createClient();

  const [{ data: summary }, { data: kpis, error }] = await Promise.all([
    supabase.rpc("dashboard_growth_summary").maybeSingle(),
    fetchOverviewKpis(),
  ]);

  return (
    <PageTransition>
      <PageHeader
        title="Resumen"
        description="Centro de comando: qué está pasando ahora y qué necesita una decisión."
      />

      {error ? (
        <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
          No se pudieron cargar los KPIs: {error}
        </p>
      ) : (
        <>
          <section>
            <h2 className="font-display mb-3 text-lg uppercase text-neutral-on-surface">
              Ahora mismo
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Partidos hoy"
                value={kpis?.matches_today ?? 0}
                hint="agendados para hoy"
                icon={CalendarCheck}
              />
              <StatCard
                label="En vivo"
                value={kpis?.matches_live ?? 0}
                hint="jugándose ahora"
                icon={Radio}
                tone={(kpis?.matches_live ?? 0) > 0 ? "positive" : "neutral"}
              />
              <StatCard
                label="Próximos 7 días"
                value={kpis?.matches_upcoming_7d ?? 0}
                hint="pendientes o confirmados"
                icon={Swords}
              />
              <StatCard
                label="Errores 24h"
                value={kpis?.errors_24h ?? 0}
                hint="en app_logs"
                icon={AlertTriangle}
                tone={(kpis?.errors_24h ?? 0) > 0 ? "danger" : "neutral"}
                delta={{ previous: kpis?.errors_prev_24h ?? 0 }}
                deltaInverted
              />
            </div>
          </section>

          <section>
            <h2 className="font-display mb-3 text-lg uppercase text-neutral-on-surface">
              Requiere atención
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {QUEUES.map((queue) => {
                const pending = kpis?.[queue.key] ?? 0;
                const Icon =
                  queue.key === "disputes_pending"
                    ? Scale
                    : queue.key === "wo_claims_pending"
                      ? Flag
                      : ShieldAlert;

                return (
                  <Link
                    key={queue.href}
                    href={queue.href}
                    className={`rounded-lg border p-5 transition ${
                      pending > 0
                        ? "border-warning-tertiary/40 bg-warning-tertiary/5 hover:border-warning-tertiary hover:bg-warning-tertiary/10"
                        : "border-neutral-outline-variant bg-surface-container hover:border-brand-primary hover:bg-surface-high"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-display flex items-center gap-2 text-lg uppercase text-neutral-on-surface">
                        <Icon className="size-4 text-neutral-outline" aria-hidden="true" />
                        {queue.label}
                      </p>
                      <span
                        className={`font-display text-3xl tabular-nums ${
                          pending > 0 ? "text-warning-tertiary" : "text-neutral-outline"
                        }`}
                      >
                        {pending}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-on-surface-variant">
                      {queue.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="font-display mb-3 text-lg uppercase text-neutral-on-surface">
              Tendencia (7 días)
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Altas"
                value={kpis?.signups_7d ?? 0}
                hint={`${(summary?.profiles_count ?? 0).toLocaleString("es-AR")} en total`}
                icon={UserPlus}
                delta={{ previous: kpis?.signups_prev_7d ?? 0 }}
              />
              <StatCard
                label="Partidos creados"
                value={kpis?.matches_created_7d ?? 0}
                hint={`${(summary?.matches_count ?? 0).toLocaleString("es-AR")} en total`}
                icon={Activity}
                delta={{ previous: kpis?.matches_created_prev_7d ?? 0 }}
              />
              <StatCard
                label="Equipos activos"
                value={kpis?.active_teams ?? 0}
                hint={`de ${kpis?.total_teams ?? 0} creados`}
                icon={Users}
              />
              {/*
                `null` y 0% no son lo mismo: null es "no hubo ningún partido en
                la ventana", 0% es "hubo partidos y no se presentó nadie". La
                RPC devuelve NULL en el primer caso y StatCard lo pinta como —.
              */}
              <StatCard
                label="Tasa de check-in"
                value={
                  kpis?.checkin_rate_30d === null || kpis?.checkin_rate_30d === undefined
                    ? null
                    : `${kpis.checkin_rate_30d}%`
                }
                hint="convocados presentes · 30 días"
                icon={CalendarCheck}
              />
            </div>
          </section>
        </>
      )}

      <section>
        <h2 className="font-display mb-3 text-lg uppercase text-neutral-on-surface">
          Paneles
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PANELS.map((panel) => (
            <Link
              key={panel.href}
              href={panel.href}
              className="rounded-lg border border-neutral-outline-variant bg-surface-container p-5 transition hover:border-brand-primary hover:bg-surface-high"
            >
              <p className="font-display text-lg uppercase text-neutral-on-surface">
                {panel.label}
              </p>
              <p className="mt-1 text-sm text-neutral-on-surface-variant">
                {panel.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
