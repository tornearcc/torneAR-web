/**
 * Paleta y tamaño de las tarjetas de `/api/og/*`.
 *
 * Hex duplicados de `app/globals.css` a propósito — mismo motivo que
 * `components/charts/chart-theme.ts`: Satori no resuelve custom properties
 * de CSS (`var(--brand-primary)` no funciona dentro de un árbol que termina
 * rasterizado), necesita el valor final. Si un token de marca cambia, hay
 * que actualizar los tres archivos (acá, chart-theme.ts, globals.css).
 */

export const OG_COLORS = {
  surfaceLowest: "#0e0e0e",
  surfaceContainer: "#201f1f",
  surfaceHigh: "#2a2a2a",
  brandPrimary: "#53e076",
  brandPrimaryRgb: "83, 224, 118",
  brandGold: "#fabd32",
  onSurface: "#e5e2e1",
  onSurfaceVariant: "#bccbb9",
} as const;

/**
 * 1080×1350 (4:5) — el aspect ratio que más espacio vertical ocupa en el
 * feed de Instagram sin recortarse. Un solo tamaño por ahora: parametrizar
 * story (9:16) o cuadrado (1:1) es trabajo de una fase futura, no de este
 * primer corte del Content Factory.
 */
export const OG_SIZE = { width: 1080, height: 1350 } as const;
