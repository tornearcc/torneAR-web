/**
 * Paleta y ejes de Recharts, en un solo lugar.
 *
 * Los hex están duplicados de app/globals.css a propósito: Recharts dibuja
 * SVG plano y no resuelve custom properties de forma consistente en el sitio
 * de render (`stroke="var(--color-brand-primary)"` falla en varios
 * subcomponentes). Antes esta duplicación vivía copiada en cada uno de los
 * tres charts; acá está una sola vez, y si cambia un token de marca hay un
 * único archivo que actualizar.
 *
 * Neutros, amarilla y roja siguen la paleta de cancha del dashboard
 * (globals.css, `:root:has([data-admin-shell])`), que es el único lugar donde
 * se dibujan gráficos.
 */
export const CHART_COLORS = {
  brandPrimary: "#53e076", // --brand-primary
  info: "#8ccdff", // --info-secondary
  warn: "#ffd23f", // --card-yellow
  error: "#ff5a4e", // --card-red
  alertOrange: "#e8821a", // --danger-alert-orange
  outline: "#849a89", // --chalk-faint
  outlineVariant: "#2e4d3c", // --chalk-line
  onSurface: "#eef2ea", // --chalk
  onSurfaceVariant: "#b4c4b6", // --chalk-dim
  surfaceContainer: "#1a3326", // --slate
  surfaceHigh: "#22402f", // --slate-high

  /*
   * Series de los gráficos con más de una serie, en este orden fijo. El verde,
   * la amarilla y la roja NO se usan como series: en el dashboard dicen
   * «en orden», «requiere atención» y «crítico». Validadas con el script del
   * skill dataviz sobre el césped (#0f2419): banda de luminosidad, croma,
   * separación para daltonismo y contraste, todo OK. Una serie sola va en
   * tiza (`onSurfaceVariant`), sin color.
   */
  series1: "#3987e5", // azul
  series2: "#d55181", // magenta
  series3: "#9085e9", // violeta
} as const;

/** Props comunes de `<XAxis>` / `<YAxis>` — evita repetir 4 atributos por eje. */
export const AXIS_PROPS = {
  stroke: CHART_COLORS.onSurfaceVariant,
  fontSize: 12,
  tickLine: false,
} as const;

/** Props comunes de `<CartesianGrid>`. */
export const GRID_PROPS = {
  strokeDasharray: "3 3",
  stroke: CHART_COLORS.outlineVariant,
} as const;

/**
 * Formatea una fecha `YYYY-MM-DD` de Postgres a `DD/MM`.
 *
 * Se ancla a UTC (`T00:00:00Z` + `timeZone: "UTC"`) para no correr un día
 * según la zona horaria del navegador que renderiza.
 */
export function formatDay(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
}
