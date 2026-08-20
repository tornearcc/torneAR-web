/**
 * "1 ago 2026 — 8 ago 2026" para el pie de las tarjetas.
 *
 * No reutiliza `formatRangeLabel` de `lib/date-range.ts`: esa función toma
 * un `ResolvedRange` completo (con `preset`/`days`), y acá sólo se tienen
 * las dos fechas que devuelve `content_weekly_highlights` — construir un
 * `ResolvedRange` falso sólo para reusar el formateo sería más código que
 * este helper de dos líneas.
 */
export function formatRangeLabelPlain(from: string, to: string): string {
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  return `${fmt(from)} — ${fmt(to)}`;
}

/**
 * Etiqueta corta del formato: `FUTBOL_5` → `F5`.
 *
 * Copia deliberada del `FORMAT_SHORT` de `components/admin/DisputesQueue.tsx`
 * y no un import: aquél es una constante privada de un Client Component, y
 * exportarla desde ahí arrastraría la directiva `"use client"` hasta este
 * módulo, que corre en el Route Handler de `/api/og`. Si un día aparece un
 * tercer consumidor, ese es el momento de subir el mapa a un `lib/` común.
 */
const FORMAT_SHORT: Record<string, string> = {
  FUTBOL_5: "F5",
  FUTBOL_6: "F6",
  FUTBOL_7: "F7",
  FUTBOL_8: "F8",
  FUTBOL_9: "F9",
  FUTBOL_11: "F11",
};

/**
 * "RANKING · F5 · 4 AGO" para el subtítulo de la tarjeta del Partidazo.
 *
 * `format` es nullable en la base (hay partidos viejos sin formato cargado)
 * y `played_at` puede venir vacío en teoría; las partes que faltan se
 * omiten en vez de aparecer como "null" o como un separador colgando.
 */
export function formatMatchSubtitle(
  matchType: string,
  format: string | null,
  playedAt: string | null,
): string {
  const parts = [matchType];

  if (format) parts.push(FORMAT_SHORT[format] ?? format);

  if (playedAt) {
    parts.push(
      new Date(playedAt)
        .toLocaleDateString("es-AR", { day: "numeric", month: "short" })
        .toUpperCase(),
    );
  }

  return parts.join(" · ");
}
