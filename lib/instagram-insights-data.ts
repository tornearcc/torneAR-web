import { createClient } from "@/lib/supabase/server";
import type { ResolvedRange } from "@/lib/date-range";
import type { Database } from "@/types/supabase";

/**
 * Estadísticas de Instagram que trae `instagram-sync` todos los días (P2-8,
 * migración 20261005120000 de torneAR). Dos lecturas, las dos por RPC de admin:
 *
 * - `dashboard_instagram_insights`: un punto por día del rango (hora
 *   argentina), con NULL en los días sin dato (antes de conectar la cuenta, o
 *   el día de hoy, que se carga mañana a las 06:00).
 * - `dashboard_instagram_posts`: las publicaciones hechas en el rango con su
 *   último snapshot (métricas acumuladas desde que se publicó).
 */

export type InstagramDay = Database["public"]["Functions"]["dashboard_instagram_insights"]["Returns"][number];
export type InstagramPost = Database["public"]["Functions"]["dashboard_instagram_posts"]["Returns"][number];

export interface Result<T> {
  data: T;
  error: string | null;
}

export async function fetchInstagramInsights(range: ResolvedRange): Promise<Result<InstagramDay[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_instagram_insights", {
    p_from: range.from,
    p_to: range.to,
  });

  if (error) {
    if (error.code !== "42501") console.error("[social] dashboard_instagram_insights falló:", error.message);
    return { data: [], error: error.message };
  }
  return { data: data ?? [], error: null };
}

export async function fetchInstagramPosts(range: ResolvedRange): Promise<Result<InstagramPost[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_instagram_posts", {
    p_from: range.from,
    p_to: range.to,
  });

  if (error) {
    if (error.code !== "42501") console.error("[social] dashboard_instagram_posts falló:", error.message);
    return { data: [], error: error.message };
  }
  return { data: data ?? [], error: null };
}

export type InstagramTotals = Record<
  "views" | "reach" | "profile_views" | "website_clicks" | "total_interactions" | "shares" | "saves",
  number | null
> & {
  /** Días del rango con dato. Sin días, todo es NULL (no 0). */
  daysWithData: number;
};

/**
 * Suma del período. El alcance se suma igual, pero es una suma de alcances
 * diarios: la misma cuenta que vio contenido dos días cuenta dos veces. Por
 * eso la página lo muestra como «promedio por día» y no como total.
 */
export function totalsOf(days: InstagramDay[]): InstagramTotals {
  const withData = days.filter((d) => d.views !== null || d.reach !== null);
  const sum = (pick: (d: InstagramDay) => number | null) =>
    withData.length === 0 ? null : withData.reduce((acc, d) => acc + (pick(d) ?? 0), 0);

  return {
    views: sum((d) => d.views),
    reach: sum((d) => d.reach),
    profile_views: sum((d) => d.profile_views),
    website_clicks: sum((d) => d.website_clicks),
    total_interactions: sum((d) => d.total_interactions),
    shares: sum((d) => d.shares),
    saves: sum((d) => d.saves),
    daysWithData: withData.length,
  };
}

/** Porcentaje con un decimal, o null si no hay base. */
export function rate(part: number | null, whole: number | null): number | null {
  if (part === null || whole === null || whole === 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}
