/**
 * Rango de fechas de los paneles analíticos, resuelto desde `searchParams`.
 *
 * El estado vive en la URL y no en un `useState` por tres razones concretas:
 * el rango queda compartible por link, el re-fetch lo hace el Server
 * Component (no hay que exponer una ruta de API ni traer los datos al
 * cliente), y el `loading.tsx` de cada segmento aparece solo mientras Next
 * re-renderiza. Un filtro con estado local habría necesitado las tres cosas
 * a mano.
 *
 * Formato en la URL:
 *   ?range=7d|30d|90d|ytd            → preset, sin fechas explícitas
 *   ?range=custom&from=…&to=…        → rango arbitrario (YYYY-MM-DD)
 */

export const RANGE_PRESETS = ["7d", "30d", "90d", "ytd", "custom"] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];

/**
 * Los presets que se resuelven solos a partir de "hoy". `custom` queda afuera
 * porque necesita las dos fechas de la URL, y tenerlo en su propio tipo evita
 * el cast que haría falta en cada llamada a `buildPreset`.
 */
export type FixedPreset = Exclude<RangePreset, "custom">;

export const DEFAULT_PRESET: FixedPreset = "30d";

export const PRESET_LABELS: Record<RangePreset, string> = {
  "7d": "7 días",
  "30d": "30 días",
  "90d": "90 días",
  ytd: "Este año",
  custom: "Personalizado",
};

export interface ResolvedRange {
  /** Inclusive, YYYY-MM-DD. */
  from: string;
  /** Inclusive, YYYY-MM-DD. */
  to: string;
  preset: RangePreset;
  /** Cantidad de días que abarca, inclusive. */
  days: number;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Fecha de hoy en UTC, como YYYY-MM-DD.
 *
 * UTC y no la zona local del servidor a propósito: las RPCs comparan contra
 * `current_date` de Postgres, que en Supabase corre en UTC. Si el runtime de
 * Next resolviera "hoy" en otra zona, el último día de la serie podría pedirse
 * fuera del rango que la base considera existente y el gráfico terminaría con
 * un día fantasma en 0.
 */
export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function isValidISODate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function shiftDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  const ms =
    new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000) + 1; // inclusive
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Traduce los `searchParams` de una página a un rango concreto.
 *
 * Nunca tira ni redirige ante una URL rota: cualquier parámetro inválido cae
 * al preset por defecto. Un link mal copiado tiene que mostrar el panel de
 * siempre, no una pantalla de error.
 */
export function resolveDateRange(params: {
  range?: string | string[];
  from?: string | string[];
  to?: string | string[];
}): ResolvedRange {
  const today = todayUTC();
  const rawPreset = firstParam(params.range);
  const preset: RangePreset = RANGE_PRESETS.includes(rawPreset as RangePreset)
    ? (rawPreset as RangePreset)
    : DEFAULT_PRESET;

  if (preset === "custom") {
    const from = firstParam(params.from);
    const to = firstParam(params.to);

    if (from && to && isValidISODate(from) && isValidISODate(to) && from <= to) {
      return { from, to, preset: "custom", days: daysBetween(from, to) };
    }
    // Custom mal formado: se degrada al default en vez de romper.
    return buildPreset(DEFAULT_PRESET, today);
  }

  return buildPreset(preset, today);
}

function buildPreset(preset: FixedPreset, today: string): ResolvedRange {
  const from =
    preset === "ytd"
      ? `${today.slice(0, 4)}-01-01`
      : shiftDays(today, -(Number(preset.replace("d", "")) - 1));

  return { from, to: today, preset, days: daysBetween(from, today) };
}

/** "1 ene 2026 — 31 mar 2026", para la bajada del panel. */
export function formatRangeLabel(range: ResolvedRange): string {
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(range.from)} — ${fmt(range.to)}`;
}
