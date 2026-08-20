import { createClient } from "@/lib/supabase/server";
import type { ResolvedRange } from "@/lib/date-range";
import type { Database } from "@/types/supabase";
import type { SocialPlatform } from "@/lib/social-platforms";

/**
 * Lecturas del termómetro de redes sociales (Fase 1 de la épica de
 * Marketing & Growth).
 *
 * `social_accounts` tiene policy de SELECT directa para admin (igual que
 * `app_logs`), así que el listado de cuentas va por query directa. La serie
 * agregada va por RPC porque necesita rellenar el rango de fechas con
 * `generate_series` — eso vive en Postgres, no en un loop de JS (§1.2 de
 * WEB_SPECIFICATION.md).
 *
 * Las constantes de plataforma (`PLATFORM_LABELS`, etc.) viven en
 * `lib/social-platforms.ts`, no acá — ver el comentario de ese archivo.
 */
export {
  SOCIAL_PLATFORMS,
  PLATFORM_LABELS,
  isSocialPlatform,
  type SocialPlatform,
} from "@/lib/social-platforms";

type SocialAccountRow = Database["public"]["Tables"]["social_accounts"]["Row"];

export interface Result<T> {
  data: T;
  error: string | null;
}

/**
 * Todas las cuentas configuradas (activas o no). El formulario de carga
 * necesita ver las inactivas también, para no dejarlas huérfanas de datos
 * si alguien las reactiva más adelante.
 */
export async function fetchSocialAccounts(): Promise<Result<SocialAccountRow[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_accounts")
    .select(
      // access_token_secret_id sólo se pide como booleano-de-presencia
      // (IS NOT NULL en la UI) — el token en sí nunca sale de Vault, ni
      // siquiera esta columna lo expone: es un uuid puntero, no el secreto.
      "id, platform, handle, display_name, is_active, external_id, created_at, access_token_secret_id, token_expires_at, last_synced_at, last_sync_error",
    )
    .order("platform");

  if (error) {
    if (error.code !== "42501") {
      console.error("[social] social_accounts falló:", error.message);
    }
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

export interface SocialMetricPoint {
  day: string;
  followers: number | null;
  following: number | null;
  posts_count: number | null;
  reach: number | null;
  views: number | null;
  profile_views: number | null;
  engagements: number | null;
}

export async function fetchSocialTimeseries(
  platform: SocialPlatform,
  range: ResolvedRange,
): Promise<Result<SocialMetricPoint[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_social_timeseries", {
    p_platform: platform,
    p_from: range.from,
    p_to: range.to,
  });

  if (error) {
    if (error.code !== "42501") {
      console.error("[social] dashboard_social_timeseries falló:", error.message);
    }
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

/**
 * Último valor no nulo de una serie — para el "seguidores hoy" del selector
 * de cuenta. Recorre desde el final y no usa `at(-1)`: el último punto de la
 * serie casi siempre es hoy, y hoy típicamente no tiene carga todavía.
 */
export function latestKnownFollowers(points: SocialMetricPoint[]): number | null {
  for (let i = points.length - 1; i >= 0; i--) {
    const value = points[i].followers;
    if (value !== null) return value;
  }
  return null;
}

/** Primer valor no nulo de una serie — base para el delta del período. */
export function firstKnownFollowers(points: SocialMetricPoint[]): number | null {
  for (const point of points) {
    if (point.followers !== null) return point.followers;
  }
  return null;
}

/**
 * Suma de una métrica nullable ignorando los huecos. `null` en cada punto
 * del período completo (nunca se cargó nada) se distingue de "sumó 0" por
 * separado — este helper sólo dice "de lo que sí se cargó, cuánto suma".
 */
export function sumNullable<T>(
  rows: T[],
  pick: (row: T) => number | null,
): number | null {
  let total: number | null = null;
  for (const row of rows) {
    const value = pick(row);
    if (value === null) continue;
    total = (total ?? 0) + value;
  }
  return total;
}
