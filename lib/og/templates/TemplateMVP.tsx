import { OG_COLORS } from "@/lib/og/card-theme";
import type { MvpHighlight } from "@/lib/og/highlights";
import type { ResolvedImage } from "@/lib/og/safe-image";
import { CardImage, CardShell } from "@/lib/og/templates/CardShell";

/**
 * Tarjeta "MVP de la semana".
 *
 * El marco (fondo, logo, eyebrow, pie) y las reglas de Satori que hay que
 * respetar están en `CardShell.tsx` — leer ese comentario antes de tocar
 * cualquier plantilla.
 */
export function TemplateMVP({
  highlight,
  image,
  from,
  to,
}: {
  highlight: MvpHighlight;
  image: ResolvedImage;
  from: string;
  to: string;
}) {
  const displayName = highlight.full_name || highlight.username;

  return (
    <CardShell
      eyebrow="MVP DE LA SEMANA"
      from={from}
      to={to}
      handle={`tornear.app/i/${highlight.username}`}
    >
      <CardImage image={image} size={320} radius={999} />

      <span
        style={{
          fontFamily: "Barlow Condensed",
          fontWeight: 800,
          fontSize: 76,
          lineHeight: 1,
          textAlign: "center",
          color: OG_COLORS.onSurface,
        }}
      >
        {displayName.toUpperCase()}
      </span>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 28px",
          borderRadius: 999,
          backgroundColor: `rgba(${OG_COLORS.brandPrimaryRgb}, 0.15)`,
        }}
      >
        <span
          style={{
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: 32,
            color: OG_COLORS.brandPrimary,
          }}
        >
          {highlight.votes} {highlight.votes === 1 ? "voto" : "votos"}
        </span>
      </div>
    </CardShell>
  );
}
