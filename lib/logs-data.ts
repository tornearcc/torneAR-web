import { createClient } from "@/lib/supabase/server";
import type { ResolvedRange } from "@/lib/date-range";
import type { LogFilters } from "@/lib/logs-filters";
import type { Database } from "@/types/supabase";

export type LogRow = Pick<
  Database["public"]["Tables"]["app_logs"]["Row"],
  "id" | "level" | "message" | "details" | "user_id" | "created_at"
>;

export interface LogsPage {
  rows: LogRow[];
  /** Total de filas que matchean los filtros, no las de esta página. */
  total: number;
  error: string | null;
}

/**
 * Una página de logs, filtrada y contada en Postgres.
 *
 * Query directa y no RPC: `app_logs` sí tiene policy de SELECT para admin
 * (`app_logs_select_admin`), así que la RLS ya hace de guard y no hay
 * agregación que justifique una `SECURITY DEFINER` — a diferencia de la serie
 * del gráfico, que sí cuenta por día y por eso vive en
 * `dashboard_logs_timeseries`.
 *
 * `count: "exact"` en el mismo request devuelve el total que matchea los
 * filtros junto con la página. Es lo que permite que el pie de tabla diga
 * "1-25 de 928" en vez del "N de 100" que decía la versión anterior, donde
 * los dos números salían del mismo array ya truncado y el segundo era
 * simplemente falso.
 */
export async function fetchLogsPage(filters: LogFilters): Promise<LogsPage> {
  const supabase = await createClient();

  let query = supabase
    .from("app_logs")
    .select("id, level, message, details, user_id, created_at", { count: "exact" });

  // El rango llega como fechas; `to` se expande al día completo sumando uno y
  // usando `lt`, porque `lte '2026-08-19'` se interpreta como las 00:00 de ese
  // día y se comería los logs de la última jornada.
  query = query
    .gte("created_at", `${filters.range.from}T00:00:00Z`)
    .lt("created_at", `${nextDay(filters.range.to)}T00:00:00Z`);

  if (filters.levels.length > 0) {
    query = query.in("level", filters.levels);
  }

  if (filters.query) {
    // `ilike` con comodines a ambos lados: no hay índice que lo cubra hoy, así
    // que es un seq-scan. Con ~1k filas es irrelevante; si `app_logs` crece a
    // seis cifras hay que instalar `pg_trgm` y agregar un índice GIN sobre
    // `message` (ver nota en el README de esta fase). Se escapan los comodines
    // del usuario para que un `%` tipeado busque un `%` literal y no todo.
    query = query.ilike("message", `%${escapeLikePattern(filters.query)}%`);
  }

  const offset = (filters.page - 1) * filters.size;

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + filters.size - 1);

  if (error) {
    return { rows: [], total: 0, error: error.message };
  }

  return { rows: data ?? [], total: count ?? 0, error: null };
}

export interface LogsSeriesPoint {
  day: string;
  info_count: number;
  warn_count: number;
  error_count: number;
}

export async function fetchLogsTimeseries(
  range: ResolvedRange,
): Promise<{ data: LogsSeriesPoint[]; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("dashboard_logs_timeseries", {
    p_from: range.from,
    p_to: range.to,
  });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Neutraliza los comodines de LIKE en lo que tipeó el usuario.
 *
 * Sin esto, buscar `100%` devolvería todo lo que empieza con "100", y un `_`
 * matchearía cualquier carácter. PostgREST no expone `ESCAPE`, pero `\` es el
 * carácter de escape por defecto de Postgres, así que alcanza con anteponerlo.
 */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
