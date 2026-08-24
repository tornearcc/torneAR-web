import { OG_COLORS } from "@/lib/og/card-theme";
import type { TopScorerHighlight } from "@/lib/og/highlights";
import type { ResolvedImage } from "@/lib/og/safe-image";
import { CardImage, CardShell } from "@/lib/og/templates/CardShell";

/**
 * Tarjeta "Goleador de la semana". Reglas de Satori y marco compartido: ver
 * `CardShell.tsx`.
 *
 * Estructuralmente es la hermana de `TemplateMVP` —misma tarjeta de
 * jugador— con una diferencia deliberada: el número protagonista es el de
 * goles, en Barlow Condensed grande, y no un badge chico. Un MVP se define
 * por votos (un dato blando, mejor en segundo plano); un goleador se define
 * por una cifra, y la cifra es la noticia.
 *
 * `matches` va debajo porque sin él "12 goles" no se distingue de un solo
 * partido irrepetible.
 */
export function TemplateTopScorer({
  highlight,
  image,
  from,
  to,
}: {
  highlight: TopScorerHighlight;
  image: ResolvedImage;
  from: string;
  to: string;
}) {
  const displayName = highlight.full_name || highlight.username;

  return (
    <CardShell
      eyebrow="GOLEADOR DE LA SEMANA"
      from={from}
      to={to}
      handle={`tornear.vercel.app/i/${highlight.username}`}
    >
      <CardImage image={image} size={280} radius={999} />

      <span
        style={{
          fontFamily: "Barlow Condensed",
          fontWeight: 800,
          fontSize: 72,
          lineHeight: 1,
          textAlign: "center",
          color: OG_COLORS.onSurface,
        }}
      >
        {displayName.toUpperCase()}
      </span>

      {/* Fila propia: el número y la palabra "GOLES" comparten línea de base
          pero con tamaños muy distintos, así que no pueden ser un solo span
          si se quiere que el número domine sin empujar la palabra. */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        <span
          style={{
            fontFamily: "Barlow Condensed",
            fontWeight: 800,
            fontSize: 168,
            lineHeight: 1,
            color: OG_COLORS.brandPrimary,
          }}
        >
          {highlight.goals}
        </span>
        <span
          style={{
            fontFamily: "Barlow Condensed",
            fontWeight: 800,
            fontSize: 64,
            color: OG_COLORS.brandPrimary,
          }}
        >
          {highlight.goals === 1 ? "GOL" : "GOLES"}
        </span>
      </div>

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
            fontSize: 30,
            color: OG_COLORS.brandPrimary,
          }}
        >
          en {highlight.matches} {highlight.matches === 1 ? "partido" : "partidos"}
        </span>
      </div>
    </CardShell>
  );
}
