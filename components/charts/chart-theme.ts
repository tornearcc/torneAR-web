/**
 * Paleta y ejes de Recharts, en un solo lugar.
 *
 * Los hex están duplicados de app/globals.css a propósito: Recharts dibuja
 * SVG plano y no resuelve custom properties de forma consistente en el sitio
 * de render (`stroke="var(--color-brand-primary)"` falla en varios
 * subcomponentes). Antes esta duplicación vivía copiada en cada uno de los
 * tres charts; acá está una sola vez, y si cambia un token de marca hay un
 * único archivo que actualizar.
 */
export const CHART_COLORS = {
  brandPrimary: "#53e076", // --brand-primary
  info: "#8ccdff", // --info-secondary
  warn: "#fabd32", // --warning-tertiary
  error: "#ffb4ab", // --danger-error
  alertOrange: "#e8821a", // --danger-alert-orange
  outline: "#869585", // --neutral-outline
  outlineVariant: "#3d4a3d", // --neutral-outline-variant
  onSurface: "#e5e2e1", // --neutral-on-surface
  onSurfaceVariant: "#bccbb9", // --neutral-on-surface-variant
  surfaceContainer: "#201f1f", // --surface-container
  surfaceHigh: "#2a2a2a", // --surface-high
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
