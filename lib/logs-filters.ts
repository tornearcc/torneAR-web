import { resolveDateRange, type ResolvedRange } from "@/lib/date-range";

/**
 * Filtros del explorador de logs, resueltos desde `searchParams`.
 *
 * Todo el estado vive en la URL — nivel, rango, búsqueda, página y tamaño —
 * por la misma razón que el filtro de fechas de los otros paneles: un filtro
 * de logs es algo que se comparte ("mirá este error"), y con estado local no
 * hay nada que pegar en un chat.
 *
 * Formato:
 *   ?level=error,warn  &range=30d  &q=texto  &page=2  &size=50
 */

export const LOG_LEVELS = ["info", "warn", "error"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export const PAGE_SIZES = [25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export const DEFAULT_PAGE_SIZE: PageSize = 25;

export interface LogFilters {
  /** Vacío = todos los niveles. No se guarda como los 3 para que la URL sea corta. */
  levels: LogLevel[];
  range: ResolvedRange;
  /** Búsqueda por substring en `message`. Vacío = sin filtro. */
  query: string;
  /** 1-indexada, como la ve el usuario. */
  page: number;
  size: PageSize;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function resolveLogFilters(params: {
  [key: string]: string | string[] | undefined;
}): LogFilters {
  const rawLevels = firstParam(params.level) ?? "";
  const levels = rawLevels
    .split(",")
    .map((l) => l.trim())
    .filter((l): l is LogLevel => LOG_LEVELS.includes(l as LogLevel));

  const rawSize = Number(firstParam(params.size));
  const size = PAGE_SIZES.includes(rawSize as PageSize)
    ? (rawSize as PageSize)
    : DEFAULT_PAGE_SIZE;

  const rawPage = Number(firstParam(params.page));
  // `Math.floor` además de `>= 1`: `?page=2.5` produciría un offset
  // fraccionario y PostgREST devolvería un rango sin sentido.
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;

  return {
    // Los 3 niveles seleccionados equivale a ninguno: se normaliza a vacío
    // para no mandar un `.in()` que la base tiene que evaluar al pedo.
    levels: levels.length === LOG_LEVELS.length ? [] : dedupe(levels),
    range: resolveDateRange(params),
    query: (firstParam(params.q) ?? "").trim().slice(0, 200),
    page,
    size,
  };
}

function dedupe(levels: LogLevel[]): LogLevel[] {
  return LOG_LEVELS.filter((l) => levels.includes(l));
}

