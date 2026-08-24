import { OG_COLORS } from "@/lib/og/card-theme";
import type { EloJumpHighlight } from "@/lib/og/highlights";
import type { ResolvedImage } from "@/lib/og/safe-image";
import { CardImage, CardShell } from "@/lib/og/templates/CardShell";

/**
 * Tarjeta "Mayor salto de ELO". Reglas de Satori y marco compartido: ver
 * `CardShell.tsx`.
 *
 * El pie es `tornear.vercel.app` a secas y no `/i/<algo>`: esa ruta es del perfil
 * de un jugador y los equipos no tienen página pública propia.
 */
export function TemplateEloJump({
  highlight,
  image,
  from,
  to,
}: {
  highlight: EloJumpHighlight;
  image: ResolvedImage;
  from: string;
  to: string;
}) {
  return (
    <CardShell eyebrow="MAYOR SALTO DE ELO" from={from} to={to} handle="tornear.vercel.app">
      <CardImage image={image} size={280} radius={40} />

      <span
        style={{
          fontFamily: "Barlow Condensed",
          fontWeight: 800,
          fontSize: 68,
          lineHeight: 1,
          textAlign: "center",
          color: OG_COLORS.onSurface,
        }}
      >
        {highlight.team_name.toUpperCase()}
      </span>

      <span
        style={{
          fontFamily: "Barlow Condensed",
          fontWeight: 800,
          fontSize: 96,
          color: OG_COLORS.brandPrimary,
        }}
      >
        +{highlight.delta} ELO
      </span>

      <span
        style={{
          fontFamily: "Inter",
          fontWeight: 500,
          fontSize: 26,
          color: OG_COLORS.onSurfaceVariant,
        }}
      >
        {highlight.elo_before} → {highlight.elo_after}
      </span>
    </CardShell>
  );
}
