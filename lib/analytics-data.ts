import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { ResolvedRange } from "@/lib/date-range";

/**
 * Lecturas de los paneles analíticos.
 *
 * Todo pasa por las RPCs `dashboard_*` de la migración
 * 20260819181735_dashboard_analytics_rpcs: la agregación vive en Postgres
 * (§1.2 de WEB_SPECIFICATION.md), acá no se traen filas para contarlas en JS.
 *
 * Cada fetcher devuelve `{ data, error }` en vez de tirar. Los paneles tienen
 * varias secciones independientes y una serie que falla no debería llevarse
 * puesto el resto de la página — el patrón ya lo usaban las páginas de
 * Crecimiento y Salud.
 */

export interface Result<T> {
  data: T;
  error: string | null;
}

// ─── Resumen ─────────────────────────────────────────────────────────────────

export interface OverviewKpis {
  matches_today: number;
  matches_live: number;
  matches_upcoming_7d: number;
  disputes_pending: number;
  wo_claims_pending: number;
  reports_pending: number;
  errors_24h: number;
  errors_prev_24h: number;
  signups_7d: number;
  signups_prev_7d: number;
  matches_created_7d: number;
  matches_created_prev_7d: number;
  active_teams: number;
  total_teams: number;
  /** Porcentaje 0-100 con un decimal. `null` = no hubo partidos en la ventana. */
  checkin_rate_30d: number | null;
}

/**
 * Envuelta en `cache()` porque tiene dos consumidores por render: la página
 * de Resumen y, vía `fetchQueueCounts`, el layout que pinta los badges del
 * sidebar. Layout y page se renderizan en paralelo y no comparten datos, así
 * que sin esto la RPC saldría dos veces en cada visita al Resumen. La caché
 * dura lo que el request: dos admins nunca ven los números del otro.
 */
export const fetchOverviewKpis = cache(
  async function fetchOverviewKpis(): Promise<Result<OverviewKpis | null>> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("dashboard_overview_kpis").maybeSingle();

    // `42501` = permission denied: pasa en cada request sin sesión, porque el
    // layout y la página se renderizan en paralelo y el redirect del guard no
    // llega a frenar a la página. No es un error que valga la pena loguear.
    if (error) {
      if (error.code !== "42501") {
        console.error("[analytics] dashboard_overview_kpis falló:", error.message);
      }
      return { data: null, error: error.message };
    }

    return { data: data as OverviewKpis | null, error: null };
  },
);

// ─── Crecimiento ─────────────────────────────────────────────────────────────

export interface GrowthPoint {
  day: string;
  signups: number;
  teams: number;
}

export async function fetchGrowthTimeseries(
  range: ResolvedRange,
): Promise<Result<GrowthPoint[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_growth_timeseries", {
    p_from: range.from,
    p_to: range.to,
  });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export interface RetentionCohort {
  cohort_week: string;
  cohort_size: number;
  played_7d: number;
  played_28d: number;
  mature_7d: boolean;
  mature_28d: boolean;
}

export async function fetchRetentionCohorts(
  weeks = 8,
): Promise<Result<RetentionCohort[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_retention_cohorts", {
    p_weeks: weeks,
  });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

// ─── Actividad ───────────────────────────────────────────────────────────────

export interface ActivityPoint {
  day: string;
  matches_created: number;
  matches_scheduled: number;
  matches_finished: number;
}

export async function fetchActivityTimeseries(
  range: ResolvedRange,
): Promise<Result<ActivityPoint[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_activity_timeseries", {
    p_from: range.from,
    p_to: range.to,
  });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export interface CheckinPoint {
  day: string;
  participants: number;
  checkins: number;
}

export async function fetchCheckinTimeseries(
  range: ResolvedRange,
): Promise<Result<CheckinPoint[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_checkin_timeseries", {
    p_from: range.from,
    p_to: range.to,
  });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export interface MarketPoint {
  day: string;
  player_posts: number;
  team_posts: number;
  applications: number;
}

export async function fetchMarketTimeseries(
  range: ResolvedRange,
): Promise<Result<MarketPoint[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_market_timeseries", {
    p_from: range.from,
    p_to: range.to,
  });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

/** Suma de una columna numérica de una serie — para los totales del período. */
export function sumBy<T>(rows: T[], pick: (row: T) => number): number {
  return rows.reduce((acc, row) => acc + pick(row), 0);
}

// ─── Atribución de marketing (Fase 3) ─────────────────────────────────────────

export interface AttributionRow {
  utm_source: string;
  utm_campaign: string | null;
  signups: number;
}

/**
 * Altas agrupadas por `(utm_source, utm_campaign)` — sin atribución cae en
 * `'organico'`, nunca se filtra: no tener campaña es un dato real. Viene
 * agrupado en las dos dimensiones (no sólo por canal) para que
 * `AttributionChart` pueda sumar por canal para las barras y todavía tener
 * el detalle de campaña disponible si hace falta un desglose más fino.
 */
export async function fetchAttributionStats(
  range: ResolvedRange,
): Promise<Result<AttributionRow[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_attribution_stats", {
    p_from: range.from,
    p_to: range.to,
  });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}
